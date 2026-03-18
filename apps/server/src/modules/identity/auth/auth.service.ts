//Тут только логика. Этот кодне знает про req и res, он работает только с данными и базой.
import argon2 from "argon2";
import { prisma } from "@repo/database";
import { RegisterInput } from "@repo/validation";
import { randomUUID } from "node:crypto";
import { MailService } from "../../../shared/mail.service.js";

export class AuthService {
  static async register(data: RegisterInput) {
    //1.Проверяем наличие пользователя по этому email в БД:
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new Error("USER_ALREADY_EXISTS");

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
}
