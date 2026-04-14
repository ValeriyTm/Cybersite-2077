//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../../shared/utils/app-error.js";
import { UpdateProfileInput } from "@repo/validation";
//Для работы с путями и файлами:
import fs from "node:fs/promises";
import path from "node:path";
export class ProfileService {
  //Получаем данные о пользователе из БД:
  static async getProfile(userId: string) {
    //1) Получаем данные из БД:
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

    //2) Передаём данные контроллеру:
    return user;
  }

  //Обновляем данные о пользователе в БД:
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    console.log("Данные для обновления:", data);

    //1) Создаем объект для базы, содержащий пришедшие данные:
    const updateData: any = { ...data };

    //2) Проверки:
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

    //Если дата пришла строкой, превращаем её в объект Date для Prisma:
    if (data.birthday) {
      updateData.birthday = new Date(data.birthday);
    }
    //В schema.prisma поле birthday имеет тип DateTime. Явное преобразование через new Date()

    //3) Обновляем данные в БД и возвращаем ответ контроллеру в виде выбранных полей:
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
        await fs.unlink(oldPath); //Удаляем старый путь
      } catch (e) {
        console.error("Не удалось удалить старый аватар:", e);
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
