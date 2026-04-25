//Типы:
import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../../shared/utils/catch-async.js";
//Сервис для взаимодействия с БД для подмодуля profule:
import { ProfileService } from "./profile.service.js";
//Схема валидации Zod для обновления профиля:
import { UpdateProfileSchema } from "@repo/validation";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";

//Контроллер для получения данных о пользователе из БД:
export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  //1) Извлекаем id пользователя из запроса:
  const userId = req.user!.id;
  //id пользователя мы берем из req.user, который туда положил authMiddleware

  //2) Получаем из БД данные о пользователе:
  const userProfile = await ProfileService.getProfile(userId);

  //3) Посылаем клиенту ответ:
  res.status(200).json(userProfile);
});

//Контроллер для обновления данных о пользователе в БД:
export const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  //1) Валидируем пришедшие данные при помощи схемы Zod:
  const result = UpdateProfileSchema.safeParse(req.body);
  if (!result.success) {
    // eslint-disable-next-line
    // @ts-ignore:
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  //2) Обновляем данные в БД:
  const updatedUser = await ProfileService.updateProfile(
    req.user!.id,
    result.data,
  );

  //3) Отправляем клиенту ответ с обновленными данными:
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
