//Тут связь с HTTP. Этот код принимает запросы от клиентов, направляет их в сервис; отправляет ответ клиентам

import { Request, Response } from "express";
import {
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  ResetPasswordSchema,
} from "@repo/validation";
import { AuthService } from "./auth.service.js";
import { TokenService } from "./token.service.js";
import { SessionService } from "./session.service.js";
import { OAuthService } from "./oauth.service.js";
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
  return res.redirect(`${process.env.CLIENT_URL}/auth?activated=true`);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  // Валидация Zod (email и password):
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, "Ошибка валидации");
  }

  const loginResult = await AuthService.login(result.data);

  // ПРОВЕРКА НА 2FA
  if ("requires2FA" in loginResult && loginResult.requires2FA) {
    return res.status(200).json({
      requires2FA: true,
      userId: loginResult.userId,
    });
  }

  const { rememberMe, ...user } = loginResult;

  // 2. ОБЫЧНЫЙ ВХОД (если 2FA не нужен)
  // const { user, rememberMe } = loginResult as {
  //   user: any;
  //   rememberMe: boolean;
  // };

  // Генерируем токены:
  const tokens = TokenService.generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Записываем сессию в БД:
  await SessionService.saveToken(user.id as string, tokens.refreshToken);

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

export const changePassword = catchAsync(
  async (req: AuthRequest, res: Response) => {
    // Валидируем входящие данные:
    const result = ChangePasswordSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, "Ошибка валидации данных");
    }

    // Вызываем сервис (req.user.id берем из мидлвара авторизации):
    await AuthService.changePassword(req.user!.id, result.data);

    res.status(200).json({ message: "Пароль успешно изменен" });
  },
);

export const deleteAccount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { password } = req.body;
    if (!password) throw new AppError(400, "Введите пароль для подтверждения");

    await AuthService.deleteAccount(req.user!.id, password);

    res.clearCookie("refreshToken", { path: "/api/identity/auth" });
    res.status(200).json({ message: "Аккаунт успешно удален" });
  },
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new AppError(400, "Email обязателен");

    // Вызываем сервис (мы его набросали в прошлом шаге)
    await AuthService.forgotPassword(email);

    // Всегда отвечаем 200, даже если email нет в базе (защита от сканирования базы)
    return res.status(200).json({
      message:
        "Если такой email зарегистрирован, письмо со ссылкой отправлено.",
    });
  },
);

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  // Валидируем пароли через Zod
  const validation = ResetPasswordSchema.safeParse(req.body);
  if (!validation.success) {
    throw new AppError(400, "Пароли не совпадают или слишком простые");
  }

  const { token } = req.query; // Ожидаем ?token=abc в URL
  if (!token || typeof token !== "string") {
    throw new AppError(400, "Токен сброса не передан");
  }

  // Вызываем сервис
  await AuthService.resetPassword({
    ...validation.data,
    token,
  });

  return res
    .status(200)
    .json({ message: "Пароль успешно изменен. Теперь вы можете войти." });
});

////////////Реализуем OAuth + OIDC:
// 1. Отправляем юзера в Google
export const googleAuth = (req: Request, res: Response) => {
  const url = OAuthService.getGoogleAuthUrl();
  res.redirect(url);
};

// 2. Принимаем данные от Google
export const googleCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) throw new AppError(400, "Код авторизации не получен");

    // 1. Обмениваем код на данные из Google через OAuthService
    const googleUser = await OAuthService.getGoogleUser(code as string);

    // 2. Обрабатываем логин/регистрацию через AuthService
    const { user, tokens } = await AuthService.processGoogleUser(googleUser);

    // 3. Устанавливаем куку (используем те же настройки, что для обычного логина)
    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/identity/auth",
    });

    // 4. Редиректим на фронтенд
    // Передаем accessToken в URL, чтобы фронт его подхватил и заполнил стор
    return res.redirect(
      `${process.env.CLIENT_URL}/auth?token=${tokens.accessToken}`,
    );
  },
);

///////Реализуем 2FA:
export const setup2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AuthService.setup2FA(req.user!.id, req.user!.email);
  return res.json(result);
});

export const enable2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  await AuthService.enable2FA(req.user!.id, code);
  return res.json({ message: "2FA успешно включена" });
});

export const verify2FA = catchAsync(async (req: Request, res: Response) => {
  const { userId, code } = req.body;

  // ЛОГ ДЛЯ ПРОВЕРКИ:
  console.log("BODY RECEIVED:", req.body);

  if (!userId) {
    throw new AppError(400, "Параметр userId обязателен в теле запроса");
  }

  // 1. Проверяем код через сервис
  const user = await AuthService.verify2FA(userId, code);

  // 2. Генерируем сессию (стандартная логика как в login)
  const tokens = TokenService.generateTokens({
    id: user.id || userId, // Используем пришедший ID как запасной вариант
    email: user.email,
    role: user.role,
  });
  await SessionService.saveToken(user.id, tokens.refreshToken);

  res.cookie("refreshToken", tokens.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/identity/auth",
  });

  return res.json({
    accessToken: tokens.accessToken,
    user: user,
  });
});
