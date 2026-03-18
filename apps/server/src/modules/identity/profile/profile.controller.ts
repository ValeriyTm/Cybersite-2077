import { Response } from "express";
import { catchAsync } from "../../../shared/utils/catch-async.js";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware.js";
import { ProfileService } from "./profile.service.js";
import { UpdateProfileSchema } from "@repo/validation";
import { AppError } from "../../../shared/utils/app-error.js";

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  // id пользователя мы берем из req.user, который туда положил authMiddleware
  const userId = req.user!.id;

  //Получаем из БД данные о пользователе:
  const userProfile = await ProfileService.getProfile(userId);

  res.status(200).json(userProfile);
});

export const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  //Валидируем пришедшие данные:
  const result = UpdateProfileSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  //Обновляем данные в БД:
  const updatedUser = await ProfileService.updateProfile(
    req.user!.id,
    result.data,
  );

  res.status(200).json({
    message: "Профиль успешно обновлен",
    user: updatedUser,
  });
});

export const uploadMeAvatar = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError(400, "Файл не загружен");
    }

    //Обновляем аватар:
    const updatedUser = await ProfileService.updateAvatar(
      req.user!.id,
      req.file.filename,
    );

    res.status(200).json({
      message: "Аватар обновлен",
      avatarUrl: updatedUser.avatarUrl,
    });
  },
);
