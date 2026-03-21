//Тут только логика. Этот кодне знает про req и res, он работает только с данными и базой.
import argon2 from "argon2";
import { prisma } from "@repo/database";
import { TokenService } from "./token.service.js";
import { SessionService } from "./session.service.js";
import { TwoFactorService } from "./two-factor.service.js";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from "@repo/validation";
import { randomUUID } from "node:crypto";
import { MailService } from "../../../shared/mail.service.js";
import { AppError } from "../../../shared/utils/app-error.js";
import fs from "node:fs/promises"; // Используем промисы для асинхронности
import path from "node:path";
import crypto from "node:crypto";

export class AuthService {
  static async register(data: RegisterInput) {
    //1.Проверяем наличие пользователя по этому email в БД:
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new AppError(400, "Ошибка в email или пароле");
    }

    //2.Хэшируем пароль пользователя:
    const passwordHash = await argon2.hash(data.password);
    //3.Генерируем токен для активации:
    const activationToken = randomUUID();

    //4.Создаём и записываем пользователя в БД:
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        activationToken,
        isActivated: false, // Юзер создан, но не активен
      },
    });

    //5.Отправляем ссылку активации:
    try {
      //Создаём ссылку активации:
      const activationLink = `${process.env.API_URL}/api/identity/auth/activate/${activationToken}`;
      // Отправляем письмо (лучше делать это асинхронно, не дожидаясь ответа await):
      await MailService.sendActivationMail(user.email, activationLink);
    } catch (e) {
      console.error("❌ Ошибка отправки почты:", e);
      // На этапе разработки просто выведем ошибку в консоль.
    }

    //Возвращаем юзера:
    return user;
  }

  static async activate(token: string) {
    //Ищем в БД пользователя по ссылке активации:
    const user = await prisma.user.findUnique({
      where: { activationToken: token },
    });

    // Если токена нет, возможно пользователь уже активирован
    // В этом случае мы просто выходим из функции (контроллер сделает редирект)
    if (!user) return;

    //Меняем свойство isActiveted у юзера в БД на true:
    await prisma.user.update({
      where: { id: user.id },
      data: { isActivated: true, activationToken: null }, // Стираем токен, чтобы ссылку нельзя было юзать дважды
    });
  }

  static async login(data: LoginInput) {
    // 1. Ищем пользователя в БД по email:
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !user.passwordHash) {
      throw new AppError(401, "Неверный email или пароль");
    }

    // 2. Проверяем, активировал ли он почту
    if (!user.isActivated) {
      throw new AppError(403, "Аккаунт не активирован. Проверьте почту.");
    }

    // 3. Сверяем введенный пароль с хешем из базы
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      data.password,
    );
    if (!isPasswordValid) {
      throw new AppError(401, "Неверный email или пароль");
    }

    //4.Проверяем, нужно ли требовать 2FA:
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

    if (isAdmin && user.is2FAEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
      };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      birthday: user.birthday,
      gender: user.gender,
      rememberMe: data.rememberMe ?? false,
    };
  }

  static async getUserData(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        phone: true,
        birthday: true,
        gender: true,
      },
    });
  }

  static async logoutAll(userId: string) {
    // Удаляем абсолютно все токены этого пользователя из БД
    return prisma.token.deleteMany({
      where: { userId: userId },
    });
  }

  static async changePassword(userId: string, data: ChangePasswordInput) {
    // Ищем пользователя в базе:
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new AppError(404, "Пользователь не найден");
    }

    //Проверяем, совпадает ли старый пароль с хешем в базе
    const isMatch = await argon2.verify(user.passwordHash, data.oldPassword);
    if (!isMatch) {
      throw new AppError(400, "Текущий пароль введен неверно");
    }

    //Хешируем новый пароль:
    const hashedPassword = await argon2.hash(data.newPassword);

    //Обновляем пароль в БД:
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  static async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash)
      throw new AppError(404, "Пользователь не найден");

    // Проверяем пароль перед удалением
    const isMatch = await argon2.verify(user.passwordHash, password);
    if (!isMatch)
      throw new AppError(400, "Неверный пароль для удаления аккаунта");

    //Логика удаления аватара с сервера:
    if (user.avatarUrl) {
      try {
        // Формируем полный путь к файлу на диске
        // В БД лежит путь типа "/uploads/avatars/file.jpg", а
        // нам нужно превратить его в системный путь
        const filePath = path.join(process.cwd(), user.avatarUrl);

        await fs.unlink(filePath); // Удаляем файл
        console.log(
          `Файл ${user.avatarUrl} успешно удален при удалении аккаунта`,
        );
      } catch (err) {
        // Если файла нет на диске (например, удалили вручную), просто логируем, но не "паникуем"
        console.error("Ошибка при удалении файла аватара:", err);
      }
    }

    // Удаляем пользователя (каскадное удаление токенов сработает, если настроено в Prisma)
    await prisma.token.deleteMany({ where: { userId } });
    return prisma.user.delete({ where: { id: userId } });
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Для безопасности не говорим, что юзера нет

    // Генерируем токен на 1 час
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });

    // Отправляем письмо (используй свой MailService)
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await MailService.sendResetPasswordMail(email, link);
  }

  static async resetPassword(data: ResetPasswordInput & { token: string }) {
    // 1. Ищем юзера, у которого совпадает токен и срок жизни > текущего времени
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: data.token,
        resetPasswordExpires: {
          gt: new Date(), // "Greater Than" — срок действия еще не истек
        },
      },
    });

    if (!user) {
      throw new AppError(
        400,
        "Ссылка недействительна или срок её действия истек",
      );
    }

    // 2. Хешируем новый пароль
    const hashedPassword = await argon2.hash(data.password);

    // 3. Обновляем пароль и ОЧИЩАЕМ поля сброса, чтобы токен нельзя было юзать второй раз
    return prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  ////Реализуем OAuth + OIDC:
  static async processGoogleUser(googleUser: any) {
    // 1. Ищем или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture, // Сохраняем ссылку на фото из Google
          isActivated: true, // Google-аккаунты априори подтверждены
          passwordHash: "", // Для OAuth пароль не нужен, можно оставить пустым или генерировать случайный
        },
      });
    }

    // 2. Генерируем токены
    const tokens = TokenService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 3. Сохраняем сессию
    await SessionService.saveToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  ////Реализуем 2FA:
  // Инициация настройки: генерация секрета и QR:
  static async setup2FA(userId: string, email: string) {
    const { secret, qrCodeUrl } = await TwoFactorService.generateSecret(email);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { qrCodeUrl };
  }

  // Подтверждение и включение 2FA:
  static async enable2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.twoFactorSecret) {
      throw new AppError(400, "Настройка 2FA не была инициирована");
    }

    const isValid = TwoFactorService.verifyToken(
      code.trim(),
      user.twoFactorSecret,
    );
    if (!isValid) throw new AppError(400, "Неверный код подтверждения");

    return prisma.user.update({
      where: { id: userId },
      data: { is2FAEnabled: true },
      select: { id: true, is2FAEnabled: true },
    });
  }

  // Финальная проверка при логине:
  static async verify2FA(userId: string, code: string) {
    // 1. Обязательно находим пользователя в базе по пришедшему ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("DEBUG: User found in verify2FA:", user);

    // 2. Проверяем, существует ли он и включен ли у него 2FA
    if (!user || !user.twoFactorSecret || !user.is2FAEnabled) {
      throw new AppError(401, "Ошибка авторизации или 2FA не настроен");
    }

    // 3. Проверяем код через OTPLib
    const isValid = TwoFactorService.verifyToken(code, user.twoFactorSecret);

    if (!isValid) {
      throw new AppError(401, "Неверный код 2FA");
    }

    // 4.Возвращаем ВЕСЬ объект user.
    return user;
  }
}
