//--Тут связь с HTTP. Этот код принимает запросы от клиентов, направляет их в сервис (где осуществляется взаимодействие с БД), получает ответ от сервиса, затем отправляет ответ клиентам--
//Типы:
import { Request, Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware.js"; //Интерфейс получаемых данных от пользователя:
//Схемы валидации Zod:
import {
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  ResetPasswordSchema,
  Verify2FASchema,
  ForgotPasswordSchema,
} from "@repo/validation";
//Сервис для взаимодействия с БД для подмодуля auth:
import { authService } from "./auth.service.js";
//Сервис для работы с JWT-токенами:
import { tokenService } from "./token.service.js";
//Сервис управления сессиями пользователей:
import { sessionService } from "./session.service.js";
//Сервис для авторизации при помощи OAuth2:
import { oAuthService } from "./oauth.service.js";
//Сервис для работы с Google reCAPTCHA v3:
import { recaptchaService } from "../../../shared/services/recaptcha.service.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../../shared/utils/catch-async.js";

//Контроллер регистрации нового пользователя:
export const register = catchAsync(async (req: Request, res: Response) => {
  //1) Валидация запроса при помощи Zod:
  const result = RegisterSchema.safeParse(req.body);
  //safeParse возвращает объект,который будет иметь поле success (true/false), отвечающее за то, успешно ли прошла валидация данных. Если success: true, то будет также поле data, содержащее данные от пользователя (поля, указанные в схеме). Если success: false, то будет поле error, содержащее разлиные поля и методы.

  //Если поле success получяенного объекта имеет false, то данные не прошли валидацию:
  if (!result.success) {
    //Если данные не прошли проверку (например, email некорректен), сервер сразу возвращает
    //статус 400 (Bad Request) и список ошибок по конкретным полям:
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  //2) Проверяем капчу (до того, как лезть в БД и проверять пароль):
  //Отправляем токен капчи в Google, и получаем true или false:
  const isHuman = await recaptchaService.verify(result.data.captchaToken);
  if (!isHuman) {
    throw new AppError(
      403,
      "Ошибка безопасности: проверка reCAPTCHA не пройдена",
    );
  }

  //Если все проверки пройдены, то вызываем наш сервис работы с БД:
  const user = await authService.register(result.data);
  //Ответ от нашего сервиса пересылаем пользователю:
  res.status(201).json({
    message: "Пользователь создан!",
    //Клиенту передаём только id и email:
    user: { id: user.id, email: user.email },
  });
});

//Контроллер для работы с активацией аккаунта:
export const activate = catchAsync(async (req: Request, res: Response) => {
  //Извлекаем токен из запроса пользователя:
  const { token } = req.params;
  //Указываем пользователя как активировавшего свой аккаунт:
  await authService.activate(token);
  //После редиректим пользователя на фронтенд:
  return res.redirect(`${process.env.CLIENT_URL}/auth?activated=true`);
});

//Контроллер логина (для пользователей без 2FA):
export const login = catchAsync(async (req: Request, res: Response) => {
  //1) Валидация Zod:
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, "Ошибка валидации");
  }

  //2) Проверяем капчу (до того, как лезть в БД и проверять пароль):
  const isHuman = await recaptchaService.verify(result.data.captchaToken);
  if (!isHuman) {
    throw new AppError(
      403,
      "Ошибка безопасности: проверка reCAPTCHA не пройдена",
    );
  }

  //3) Извлекаем значение rememberMe из запроса клиента:
  const { rememberMe } = result.data;

  //4) Передаём данные сервису для проверки на корректность введенных данных, активирован ли пользователь и не является ли запрос ботом. А тот нам передаёт ответ (ошибку или данные пользователя с полем необходимости пройти 2FA):
  const loginResult = await authService.login(result.data);

  //5) Проверка на необходимость 2FA:
  if ("requires2FA" in loginResult && loginResult.requires2FA) {
    return res.status(200).json({
      requires2FA: true,
      userId: loginResult.userId,
    });
  }
  //Если сервис вернул { requires2FA: true }, контроллер прерывает обычный вход и отправляет клиенту сигнал: «Пароль верный, но теперь введи 6 цифр из приложения»

  //Если 2FA не нужна, идем далее:

  //6) Извлекаем из ответа от сервиса данные о пользователе и поле rememberMe:
  const { ...user } = loginResult;

  //7) Генерируем токены:
  const tokens = tokenService.generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name, //05.04.2026
  });

  //8) Записываем сессию в БД:
  await sessionService.saveToken(user.id as string, tokens.refreshToken);

  //9) Задаём настройки куки:
  const cookieOptions: any = {
    httpOnly: true, // Защита от XSS
    secure: process.env.NODE_ENV === "production", // Только HTTPS в продакшене
    sameSite: "lax",
    path: "/api/identity/auth",
  };

  if (rememberMe) {
    // Если rememberMe === true — 7 дней, иначе — null (сессионная кука):
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
  } else {
    // Явно удаляем свойства, если они могли попасть туда случайно:
    delete cookieOptions.maxAge;
    delete cookieOptions.expires;
  }

  //Посылаем куки:
  res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

  //10) Посылаем ответ пользователю:
  res.status(200).json({
    message: "Вход выполнен успешно",
    accessToken: tokens.accessToken, //Отправляю пользователю Access токен
    user: user,
  });
});

//Контроллер выхода с аккаунта:
export const logout = catchAsync(async (req: Request, res: Response) => {
  //1) Извлекаем refresh-токен из запроса:
  const { refreshToken } = req.cookies;

  //2) Если токен есть, то удаляем refresh-токен из БД:
  if (refreshToken) {
    await sessionService.removeToken(refreshToken);
  }

  //3) Очищаем куку с теми же параметрами, с которыми создавали:
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/identity/auth",
  });

  //4) Посылаем ответ:
  return res.status(200).json({ message: "Выход выполнен успешно" });
});

//Контроллер обновления токенов:
export const refresh = catchAsync(async (req: Request, res: Response) => {
  //1) Извлекаем refresh-токен из запроса пользователя:
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new AppError(401, "Сессия не найдена");
  }

  //2) Проверяем подпись токена (не протух ли он криптографически):
  const userData = tokenService.validateRefreshToken(refreshToken) as any;
  //3) Ищем этот конкретный токен в нашей базе данных:
  const tokenFromDb = await sessionService.findToken(refreshToken);
  // Если токена нет в базе или он не валиден по подписи — сессия скомпрометирована:
  if (!userData || !tokenFromDb) {
    // На всякий случай чистим куку на клиенте, чтобы не гонять битый токен:
    res.clearCookie("refreshToken", { path: "/api/identity/auth" });
    throw new AppError(401, "Сессия не действительна или отозвана");
  }

  //4) Идем в базу за самыми свежими данными о пользователе:
  const freshUser = await authService.getUserData(userData.id);
  if (!freshUser) {
    throw new AppError(404, "Пользователь не найден");
  }

  //5) Осуществляем ротацию токенов (Refresh Token Rotation):
  //Удаляем старый токен:
  await sessionService.removeToken(refreshToken);
  //Генерируем новую пару токенов:
  const tokens = tokenService.generateTokens({
    id: freshUser.id,
    email: freshUser.email,
    role: freshUser.role,
    name: freshUser.name,
  });

  //6) Сохраняем новый токен в БД:
  await sessionService.saveToken(freshUser.id, tokens.refreshToken);

  //7) Обновляем куку:
  res.cookie("refreshToken", tokens.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 дней
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    //Куки с refresh-токеном будут отправляться клиентом только по этому пути:
    path: "/api/identity/auth",
  });

  //8) Отправляем новый Access токен фронтенду:
  return res.json({
    accessToken: tokens.accessToken,
    user: freshUser, //Тут акутальные данные о юзере
  });
});

//Контроллер выхода со всех сессий:
export const logoutAll = catchAsync(async (req: AuthRequest, res: Response) => {
  //1) Если в запросе нет ID пользователя (например, middleware не сработал или токен пуст), мы выбрасываем ошибку (нельзя «разлогинить» того, кто не вошел):
  if (!req.user?.id) {
    throw new AppError(401, "Пользователь не авторизован");
  }
  //2) Удаляем из БД все сессии пользователя:
  await authService.logoutAll(req.user.id);

  //3) Чистим куку текущего браузера
  res.clearCookie("refreshToken", { path: "/api/identity/auth" });

  //4) Отправляем ответ:
  return res.status(200).json({ message: "Выход со всех устройств выполнен" });
});

//Контроллер смены паролей в ЛК пользователя:
export const changePassword = catchAsync(
  async (req: AuthRequest, res: Response) => {
    //1) Валидируем входящие данные при помощи Zod:
    const result = ChangePasswordSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, "Ошибка валидации данных");
    }

    //2) Вызываем сервис (req.user.id берем из мидлвара авторизации) для смены пароля в БД:
    await authService.changePassword(req.user!.id, result.data);

    //3) Посылаем ответ:
    res.status(200).json({ message: "Пароль успешно изменен" });
  },
);

//Контроллер удаления аккаунта:
export const deleteAccount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    //1) Извлекаем пароль из запроса:
    const { password } = req.body;
    if (!password) throw new AppError(400, "Введите пароль для подтверждения");

    //2) Удаляем аккаунт в БД:
    await authService.deleteAccount(req.user!.id, password);

    //3) Обнуляем куки клиенту:
    res.clearCookie("refreshToken", { path: "/api/identity/auth" });
    //4) Посылаем ответ:
    res.status(200).json({ message: "Аккаунт успешно удален" });
  },
);

//Контроллер восстановления пароля (Forgot Password):
export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    //1) Валидируем данные при помощи Zod:
    const result = ForgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.flatten().fieldErrors,
      });
    }

    //2) Извлекаем из запроса email и токен капчи:
    const { email, captchaToken } = result.data;
    if (!email) throw new AppError(400, "Email обязателен");

    //3) Проверка капчи:
    const isHuman = await recaptchaService.verify(captchaToken);
    if (!isHuman) {
      throw new AppError(
        403,
        "Ошибка безопасности: проверка reCAPTCHA не пройдена",
      );
    }

    //4) Вызываем сервис для отправки клиенту ссылки на форму восстановления пароля:
    await authService.forgotPassword(email);

    //5) Всегда отвечаем 200, даже если email нет в базе (защита от сканирования базы):
    return res.status(200).json({
      message:
        "Если такой email зарегистрирован, письмо со ссылкой отправлено.",
    });
  },
);

//Контроллер восстановления пароля (замена пароля):
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  //1) Валидируем пароли через Zod:
  const validation = ResetPasswordSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      errors: validation.error.flatten().fieldErrors,
    });
  }

  //2) Проверяем капчу (до того, как лезть в БД и проверять пароль)
  const { captchaToken, ...passwordData } = validation.data;
  const isHuman = await recaptchaService.verify(captchaToken);
  if (!isHuman) {
    throw new AppError(
      403,
      "Ошибка безопасности: проверка reCAPTCHA не пройдена",
    );
  }

  //3) Извлекаем токен из запроса:
  const { token } = req.query; // Ожидаем ?token=abc в URL
  if (!token || typeof token !== "string") {
    throw new AppError(400, "Токен сброса не передан или некорректен");
  }

  //4) Вызываем сервис, передав в него токен и данные:
  await authService.resetPassword({
    ...validation.data,
    token,
  });

  //5) Возвращаем ответ:
  return res
    .status(200)
    .json({ message: "Пароль успешно изменен. Теперь вы можете войти." });
});

//----------Реализуем OAuth + OIDC:
// 1) Отправляем данные в Google:
export const googleAuth = (req: Request, res: Response) => {
  //Отправляем запрос в Google:
  const url = oAuthService.getGoogleAuthUrl();
  //Редиректим пользователя на страницу Google для подтверждения входа:
  res.redirect(url);
};

// 2) Принимаем данные от Google:
export const googleCallback = catchAsync(
  async (req: Request, res: Response) => {
    //1) Извлекаем код из запроса (от Google приходит код):
    const { code } = req.query;
    if (!code) throw new AppError(400, "Код авторизации не получен");

    //2) Обмениваем код на данные из Google через oAuthService:
    const googleUser = await oAuthService.getGoogleUser(code as string);

    //3) Обрабатываем логин/регистрацию через authService:
    const { user, tokens } = await authService.processGoogleUser(googleUser);

    //4) Устанавливаем куку (используем те же настройки, что для обычного логина):
    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/identity/auth",
    });

    //5) Редиректим на фронтенд:
    //Передаем accessToken в URL, чтобы фронт его подхватил и заполнил стор
    return res.redirect(
      `${process.env.CLIENT_URL}/auth?token=${tokens.accessToken}`,
    );
  },
);

//-----------Реализуем 2FA:
//1) Генерируем QR-код для клиента:
export const setup2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  //Получаем QR-код и передаём его пользователю:
  const result = await authService.setup2FA(req.user!.id, req.user!.email);
  return res.json(result);
});

//2) Включаем в профиле клиента 2FA на постоянку:
export const enable2FA = catchAsync(async (req: AuthRequest, res: Response) => {
  //Получаем от клиента его введенный код:
  const { code } = req.body;
  //Передаём код в наш сервис:
  await authService.enable2FA(req.user!.id, code);
  //Сообщаем пользователю об успехе:
  return res.json({ message: "2FA успешно включена" });
});

//3) Контроллер логина (для пользователей со включенной 2FA):
export const verify2FA = catchAsync(async (req: Request, res: Response) => {
  //1) Валидация данных при помощи схемы Zod:
  const result = Verify2FASchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  //2) Извлекаем введенный юзером 6-значный код и его id:
  const { userId, code } = result.data;

  //3) Проверяем код через наш сервис:
  const user = await authService.verify2FA(userId, code);

  //4) Генерируем токены:
  const tokens = tokenService.generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  //5) Записываем токены в БД:
  await sessionService.saveToken(user.id, tokens.refreshToken);

  //6) Устанавливаем куки:
  res.cookie("refreshToken", tokens.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/identity/auth",
  });

  //7) Посылаем клиенту ответ:
  return res.json({
    accessToken: tokens.accessToken,
    user: user,
  });
});
