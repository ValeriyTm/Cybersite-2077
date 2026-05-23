//Типы:
import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/authMiddleware.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../../shared/utils/catch-async.js";
//Сервис для взаимодействия с БД для подмодуля profule:
import { ProfileService } from "./profile.service.js";
//Схема валидации Zod для обновления профиля:
import { UpdateProfileType } from "@repo/validation";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";

//Контроллер для получения данных о пользователе из БД:
export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;

  const userProfile = await ProfileService.getProfile(userId);

  res.status(200).json(userProfile);
});

//Контроллер для обновления данных о пользователе в БД:
export const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = req.body as UpdateProfileType;

  const updatedUser = await ProfileService.updateProfile(req.user.id, data);

  res.status(200).json({
    message: "Профиль успешно обновлен",
    user: updatedUser,
  });
});

//Контроллер для обновления ссылки на аватар пользователя в БД:
export const uploadMeAvatar = catchAsync(
  async (req: AuthRequest, res: Response) => {
    //1) Проверяем пришел ли в запросе файл:
    if (!req.file) {
      throw new AppError(400, "Файл не загружен");
    }

    //2) Обновляем ссылку на аватар в БД::
    const updatedUser = await ProfileService.updateAvatar(
      req.user!.id,
      req.file.filename,
    );

    //3) Передаём ответ пользователю и обновленную ссылку на аватар:
    res.status(200).json({
      message: "Аватар обновлен",
      avatarUrl: updatedUser.avatarUrl,
    });
  },
);
