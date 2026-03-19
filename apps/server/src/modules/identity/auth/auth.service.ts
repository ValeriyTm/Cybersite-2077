//Тут только логика. Этот кодне знает про req и res, он работает только с данными и базой.
import argon2 from "argon2";
import { prisma } from "@repo/database";
import { RegisterInput, LoginInput } from "@repo/validation";
import { randomUUID } from "node:crypto";
import { MailService } from "../../../shared/mail.service.js";
import { AppError } from "../../../shared/utils/app-error.js";

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
    if (!user) throw new Error("Некорректная ссылка активации");

    //Меняем свойство isActiveted у юзера в БД на true:
    await prisma.user.update({
      where: { id: user.id },
      data: { isActivated: true, activationToken: null },
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      birthday: user.birthday,
      gender: user.gender,
      rememberMe: data.rememberMe,
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
}
