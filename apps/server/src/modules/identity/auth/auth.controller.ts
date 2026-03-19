//Тут связь с HTTP. Этот код принимает запросы от клиентов, направляет их в сервис; отправляет ответ клиентам

import { Request, Response } from "express";
import { RegisterSchema, LoginSchema } from "@repo/validation";
import { AuthService } from "./auth.service.js";
import { TokenService } from "./token.service.js";
import { SessionService } from "./session.service.js";
import { AppError } from "../../../shared/utils/app-error.js";
import { catchAsync } from "../../../shared/utils/catch-async.js";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware.js";

export const register = catchAsync(async (req: Request, res: Response) => {
  //Валидация запроса при помощи Zod:
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const user = await AuthService.register(result.data);
  res.status(201).json({
    message: "Пользователь создан!",
    user: { id: user.id, email: user.email },
  });
});

export const activate = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  await AuthService.activate(token);
  // После редиректим пользователя на фронтенд:
  return res.redirect(`${process.env.CLIENT_URL}/login?activated=true`);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  // Валидация Zod (email и password):
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, "Ошибка валидации");
  }

  const { rememberMe, ...user } = await AuthService.login(result.data);
  // Генерируем токены:
  const tokens = TokenService.generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Записываем сессию в БД:
  await SessionService.saveToken(user.id, tokens.refreshToken);

  //Задаём настройки куки:
  const cookieOptions: any = {
    httpOnly: true, // Защита от XSS
    secure: process.env.NODE_ENV === "production", // Только HTTPS в продакшене
    sameSite: "lax",
    path: "/api/identity/auth",
  };

  if (rememberMe) {
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
  }
  // Если rememberMe === true — 7 дней, иначе — null (сессионная кука):

  //Посылаем куки:
  res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

  //Посылаем ответ пользователю:
  res.status(200).json({
    message: "Вход выполнен успешно",
    accessToken: tokens.accessToken, //Отправляю пользователю Access токен
    user: user,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  //Извлекаем refresh-токен из запроса:
  const { refreshToken } = req.cookies;

  //Если токен есть, то удаляем refresh-токен из БД:
  if (refreshToken) {
    await SessionService.removeToken(refreshToken);
  }

  // Очищаем куку с теми же параметрами, с которыми создавали
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/identity/auth",
  });

  return res.status(200).json({ message: "Выход выполнен успешно" });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  //Извлекаем refresh-токен из запроса пользователя:
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new AppError(401, "Сессия не найдена");
  }

  // 1.Проверяем подпись токена (не протух ли он криптографически):
  const userData = TokenService.validateRefreshToken(refreshToken) as any;
  // 2.Ищем этот конкретный токен в нашей базе данных:
  const tokenFromDb = await SessionService.findToken(refreshToken);
  // Если токена нет в базе или он не валиден по подписи — сессия скомпрометирована:
  if (!userData || !tokenFromDb) {
    // На всякий случай чистим куку, чтобы не гонять битый токен
    res.clearCookie("refreshToken", { path: "/api/identity/auth" });
    throw new AppError(401, "Сессия не действительна или отозвана");
  }

  //3.Идем в базу за самыми свежими данными о пользователе:
  const freshUser = await AuthService.getUserData(userData.id);
  if (!freshUser) {
    throw new AppError(404, "Пользователь не найден");
  }

  //4.Осуществляем ротацию токенов (Refresh Token Rotation):
  //Удаляем старый токен:
  await SessionService.removeToken(refreshToken);
  //Генерируем новую пару токенов:
  const tokens = TokenService.generateTokens({
    id: freshUser.id,
    email: freshUser.email,
    role: freshUser.role,
  });

  // 5.Сохраняем новый токен в БД:
  await SessionService.saveToken(freshUser.id, tokens.refreshToken);

  // 6.Обновляем куку:
  res.cookie("refreshToken", tokens.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 дней
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    //Куки с refresh-токеном будут отправляться клиентом только по этому пути:
    path: "/api/identity/auth",
  });

  //7.Отправляем новый Access токен фронтенду:
  return res.json({
    accessToken: tokens.accessToken,
    user: freshUser, //Тут акутальные данные о юзере
  });
});

export const logoutAll = catchAsync(async (req: AuthRequest, res: Response) => {
  // await AuthService.logoutAll(req.user!.id);
  if (!req.user?.id) {
    throw new AppError(401, "Пользователь не авторизован");
  }
  await AuthService.logoutAll(req.user.id);

  // Чистим куку текущего браузера
  res.clearCookie("refreshToken", { path: "/api/identity/auth" });

  return res.status(200).json({ message: "Выход со всех устройств выполнен" });
});
