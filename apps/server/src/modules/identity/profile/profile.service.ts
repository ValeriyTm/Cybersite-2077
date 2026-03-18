import { prisma } from "@repo/database";
import { AppError } from "../../../shared/utils/app-error.js";
import { UpdateProfileInput } from "@repo/validation";
import fs from "node:fs/promises";
import path from "node:path";
export class ProfileService {
  static async getProfile(userId: string) {
    //Получаем данные о пользователе из БД:
    const user = await prisma.user.findUnique({
      where: { id: userId },
      // Выбираем только нужные поля (пароль и токены светить нельзя):
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
      },
    });

    if (!user) throw new AppError(404, "Пользователь не найден");

    return user;
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    // Создаем объект для базы
    const updateData: any = { ...data };
    // Если дата пришла строкой, превращаем её в объект Date для Prisma
    if (data.birthday) {
      updateData.birthday = new Date(data.birthday);
    }
    //В schema.prisma поле birthday имеет тип DateTime. Явное преобразование через new Date() добавляет время по умолчанию (00:00:00), что полностью удовлетворяет базу данных.

    //Обновляем данные в БД:
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        birthday: true,
        gender: true,
      },
    });
  }

  static async updateAvatar(userId: string, filename: string) {
    // 1.Ищем текущего юзера, чтобы узнать старый аватар:
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // 2.Если старый аватар есть, удаляем файл с диска:
    if (user?.avatarUrl) {
      // Путь к файлу: убираем начальный "/" и сопоставляем с папкой на сервере
      const oldPath = path.join(process.cwd(), user.avatarUrl);
      try {
        await fs.unlink(oldPath);
      } catch (e) {
        console.error("Не удалось удалить старый аватар:", e);
        // Не кидаем ошибку дальше, чтобы загрузка нового не сорвалась
      }
    }

    //3.Создаём новый аватар:
    //Создаём путь для сохранения аватара:
    const avatarUrl = `/uploads/avatars/${filename}`;
    //Сохраняем путь аватарки в профиль пользователя в БД:
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }
}
