//----Тут только логика. Этот код не знает про req и res, он работает только с данными и БД------
//Библиотека для хэширования паролей:
import argon2 from "argon2";
import fs from "node:fs/promises"; // Используем промисы для асинхронности
import path from "node:path";
import crypto from "node:crypto";
//Функция для генерации уникального идентификатора версии 4:
import { randomUUID } from "node:crypto";
//Клиент призмы для работы с БД:
import { prisma } from "@repo/database";
//Мой сервис для работы с токенами:
import { TokenService } from "./token.service.js";
//Мой сервис для работы с сессиями пользователей:
import { SessionService } from "./session.service.js";
//Мой сервис для реазилации 2FA:
import { TwoFactorService } from "./two-factor.service.js";
//Схемы валидации Zod:
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from "@repo/validation";
//Мой сервис для работы с электронной почтой:
import { MailService } from "../../../shared/mail.service.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";

//Указываем унифицированный объект, который будет возвращаться контроллерам:
const formatUserResponse = (user: any, rememberMe = false) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatarUrl: user.avatarUrl,
  phone: user.phone,
  birthday: user.birthday,
  gender: user.gender,
  is2FAEnabled: user.is2FAEnabled,
  // rememberMe,
});

export class AuthService {
  //Записываем нового пользователя в БД:
  static async register(data: RegisterInput) {
    //1) Проверяем email по БД (вдруг такой уже зарегистрирован):
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) throw new AppError(400, "Некорректный email или пароль");
    //Не указываю, что именно email занят, т.к. это путь к брутфорс атакам.

    //2)Проверяем имя (логина), т.к. оно тоже может быть только уникальным по нашей схеме призмы:
    const existingName = await prisma.user.findUnique({
      where: { name: data.name },
    });
    if (existingName)
      throw new AppError(400, "Это имя уже занято, выберите другое");

    //3) Хэшируем пароль пользователя:
    const passwordHash = await argon2.hash(data.password);
    //4)Генерируем токен для активации (рандомная строка):
    const activationToken = randomUUID();

    //5)Создаём и записываем пользователя в БД:
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        activationToken,
        isActivated: false, // Юзер создан, но не активен
      },
    });

    //6).Отправляем ссылку активации клиенту по почте:
    try {
      //Создаём ссылку активации:
      const activationLink = `${process.env.API_URL}/api/identity/auth/activate/${activationToken}`;
      //Отправляем письмо:
      await MailService.sendActivationMail(user.email, activationLink);
    } catch (e) {
      console.error("❌ Ошибка отправки почты:", e);
      // На этапе разработки просто выведем ошибку в консоль.
    }

    //Возвращаем юзера:
    return user;
  }

  //Меняем статус активации аккаунта пользователя в БД:
  static async activate(token: string) {
    //Ищем в БД пользователя по ссылке активации:
    const user = await prisma.user.findUnique({
      where: { activationToken: token },
    });

    //Если токена нет, возможно пользователь уже активирован.
    //В этом случае мы просто выходим из функции (контроллер сделает редирект пользователя на страницу логина):
    if (!user) return;

    //Меняем свойство isActiveted у юзера в БД на true:
    await prisma.user.update({
      where: { id: user.id },
      data: { isActivated: true, activationToken: null }, // Стираем токен, чтобы ссылку нельзя было юзать дважды
    });
  }

  static async login(data: LoginInput) {
    //1) Ищем пользователя в БД по email:
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash) {
      throw new AppError(401, "Неверный email или пароль");
    }

    //2) Проверяем, активировал ли он почту
    if (!user.isActivated) {
      //Если нет, то просто прерываем процесс, сообщая пользователю о необходимости активации:
      throw new AppError(403, "Аккаунт не активирован. Проверьте почту.");
    }

    //3)Сверяем введенный пароль с хешем из базы
    const isPasswordValid = await argon2.verify(
      user.passwordHash, //Хэш с БД
      data.password, //Введенные пользователем пароль
    );
    if (!isPasswordValid) {
      throw new AppError(401, "Неверный email или пароль");
    }

    //4) Проверяем, нужно ли требовать 2FA:
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
    //Если пользователь имеет роль админ/суперадмин и у него включена 2FA, то возвращаем в контроллер поле "requires2FA: true", которое заставит пользователя проходить 2FA:
    if (isAdmin && user.is2FAEnabled) {
      return {
        requires2FA: true,
        userId: user.id,
      };
    }

    //Возвращаем все необходимые для работы клиента поля:
    return formatUserResponse(user, data.rememberMe ?? false);
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
        is2FAEnabled: true,
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
    //1) Ищем пользователя в базе:
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new AppError(404, "Пользователь не найден");
    }

    //2) Проверяем, совпадает ли старый пароль с хешем в базе
    const isMatch = await argon2.verify(user.passwordHash, data.oldPassword);
    if (!isMatch) {
      throw new AppError(400, "Текущий пароль введен неверно");
    }

    //3) Хешируем новый пароль:
    const hashedPassword = await argon2.hash(data.newPassword);

    //4) Обновляем пароль в БД:
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  static async deleteAccount(userId: string, password: string) {
    //1) Ищем пользователя в БД:
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash)
      throw new AppError(404, "Пользователь не найден");

    //2) Проверяем пароль перед удалением:
    const isMatch = await argon2.verify(user.passwordHash, password);
    if (!isMatch)
      throw new AppError(400, "Неверный пароль для удаления аккаунта");

    //3) Удаляем аватар пользователя с сервера:
    if (user.avatarUrl) {
      try {
        //Формируем полный путь к файлу на диске
        //В БД лежит путь типа "/uploads/avatars/file.jpg", а
        //нам нужно превратить его в системный путь
        const filePath = path.join(process.cwd(), user.avatarUrl);

        await fs.unlink(filePath); // Удаляем файл
        console.log(
          `Файл ${user.avatarUrl} успешно удален при удалении аккаунта`,
        );
      } catch (err) {
        // Если файла нет на диске (например, удалили вручную), просто логируем:
        console.error("Ошибка при удалении файла аватара:", err);
      }
    }

    //4( Удаляем сессии пользователя и самого пользователя:
    await prisma.token.deleteMany({ where: { userId } });
    return prisma.user.delete({ where: { id: userId } });
  }

  static async forgotPassword(email: string) {
    //1) Ищем юзера в БД по его email:
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Для безопасности не говорим, что юзера нет

    //2) Генерируем случайный токен на 1 час
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    //3) Помещаем этот токен в БД к юзеру:
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });

    //4) Отправляем письмо клиенту с токеном с ссылкой, содержащей токен:
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await MailService.sendResetPasswordMail(email, link);
  }

  static async resetPassword(data: ResetPasswordInput & { token: string }) {
    // 1) Ищем юзера, у которого совпадает токен и срок жизни ещё не истек:
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

    //2) Хешируем новый пароль
    const hashedPassword = await argon2.hash(data.password);

    //3) Обновляем в БД пароль и очищаем поля сброса, чтобы токен нельзя было юзать второй раз:
    return prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  //-----Реализуем OAuth + OIDC:
  static async processGoogleUser(googleUser: any) {
    //1) Ищем или создаем пользователя:
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

    //2) Генерируем токены:
    const tokens = TokenService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    //3) Сохраняем сессию:
    await SessionService.saveToken(user.id, tokens.refreshToken);

    //4) Возвращаем данные о юзере и токены:
    return { user, tokens };
  }

  //-----Реализуем 2FA:
  //Инициация настройки: генерация секрета и QR для клиента:
  static async setup2FA(userId: string, email: string) {
    //При помощи нашего сервиса генерируем секрет и QR-код и получаем их:
    const { secret, qrCodeUrl } = await TwoFactorService.generateSecret(email);

    //Вносим секрет в БД:
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    //Возвращаем контроллеру QR-код:
    return { qrCodeUrl };
  }

  //Подтверждение и включение 2FA для клиента:
  static async enable2FA(userId: string, code: string) {
    //1) Ищем пользователя в БД:
    const user = await prisma.user.findUnique({ where: { id: userId } });
    //Если у пользователя в БД не записан секрет для 2FA, то ему не требуется 2FA:
    if (!user?.twoFactorSecret) {
      throw new AppError(400, "Настройка 2FA не была инициирована");
    }

    //2) Проверяем на валидность код от пользователя:
    const isValid = TwoFactorService.verifyToken(
      code.trim(),
      user.twoFactorSecret,
    );
    if (!isValid) throw new AppError(400, "Неверный код подтверждения");

    //3) Устанавливаем для пользователя 2FA как активную:
    return prisma.user.update({
      where: { id: userId },
      data: { is2FAEnabled: true },
    });
  }

  //Логин для клиента с 2FA:
  static async verify2FA(userId: string, code: string) {
    //1) Ищем пользователя в БД:
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    //Проверяем, существует ли он и включен ли у него 2FA
    if (!user || !user.twoFactorSecret || !user.is2FAEnabled) {
      throw new AppError(401, "Ошибка авторизации или 2FA не настроен");
    }

    //2) Проверяем 6-значный код пользователя через OTPLib:
    const isValid = TwoFactorService.verifyToken(code, user.twoFactorSecret);
    if (!isValid) {
      throw new AppError(401, "Неверный код 2FA");
    }

    //3) Возвращаем контроллеру все необходимые данные о пользователе:
    return formatUserResponse(user);
  }
}
