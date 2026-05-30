//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";
import { UpdateProfileType } from "@repo/validation";
//Для работы с путями и файлами:
import fs from "node:fs/promises";
import path from "node:path";
//Логирование:
import { logger } from "../../../shared/lib/logger.js";

export class ProfileService {
  //Получаем данные о пользователе из БД:
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      //Выбираем только нужные поля (пароль и токены светить нельзя):
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthday: true,
        gender: true,
        role: true,
        avatarUrl: true,
        isActivated: true,
        createdAt: true,
        is2FAEnabled: true,
        defaultLat: true,
        defaultLng: true,
        defaultAddress: true,
      },
    });
    if (!user) throw new AppError(404, "Пользователь не найден");

    return user;
  }

  //Обновляем данные о пользователе в БД:
  static async updateProfile(userId: string, data: UpdateProfileType) {
    //1) Проверки:
    //Проверяем по уникальному номеру телефона:
    if (data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: userId }, // Ищем везде, кроме текущего пользователя
        },
      });
      if (existingUser) {
        throw new AppError(
          400,
          "Этот номер телефона уже используется другим аккаунтом",
        );
      }
    }

    //2) Обновляем данные в БД и возвращаем ответ контроллеру в виде выбранных полей:
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        birthday: data.birthday ? new Date(data.birthday) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        birthday: true,
        avatarUrl: true,
      },
    });
  }

  //Обновляем ссылку на аватар пользователя в БД:
  static async updateAvatar(userId: string, filename: string) {
    //1) Ищем текущего юзера, чтобы узнать старый аватар:
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    //2) Если старый аватар есть, удаляем файл с диска:
    if (user?.avatarUrl) {
      //Старый путь к файлу: убираем начальный "/" и сопоставляем с папкой на сервере
      const oldPath = path.join(process.cwd(), user.avatarUrl);
      try {
        //Eslint ругается, т.к. не знает, что мы формируем путь на сервере, а не на клиенте, поэтому:
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fs.unlink(oldPath); //Удаляем старый путь
      } catch (e) {
        logger.error("Не удалось удалить старый аватар:", e);
        // Не кидаем ошибку дальше, чтобы загрузка нового не сорвалась
      }
    }

    //3) Создаём новый аватар:
    //Создаём путь для сохранения аватара:
    const avatarUrl = `/static/avatars/${filename}`; //Путь на сервере
    //Сохраняем путь аватарки в профиль пользователя в БД:
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }
}
