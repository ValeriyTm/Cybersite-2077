//---------------Сервис для управления сессиями пользователей в базе данных через Prisma---
//Клиент призмы для работы с БД:
import { prisma } from "@repo/database";

export class SessionService {
  // Сохраняем новую сессию (токен) в базу:
  static async saveToken(userId: string, refreshToken: string) {
    //Если ID пустой, логируем ошибку и прерываем выполнение, чтобы не создать «битую» запись:
    if (!userId) {
      console.error("SessionService: Попытка сохранить токен без userId!");
      throw new Error("Наличие userId обязательно для сохранения токена в БД");
    }

    //Если токен уже есть в базе — обновим его, если нет — создадим новую запись:
    return prisma.token.upsert({
      //Поиск записи по конкретному токену:
      where: { refreshToken },
      update: { refreshToken },
      create: {
        refreshToken,
        //Связываем запись токена с конкретным пользователем через связь в схеме базы данных:
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  // Удаляем конкретную сессию (при логауте с одного устройства):
  static async removeToken(refreshToken: string) {
    //Используется deleteMany, чтобы код не «падал» с ошибкой, если токен уже был удален или не найден (например, при двойном клике на кнопку «Выход»):
    return prisma.token.deleteMany({
      where: { refreshToken },
    });
  }

  // Находим токен в базе (нужно для проверки при Refresh):
  static async findToken(refreshToken: string) {
    return prisma.token.findUnique({
      where: { refreshToken },
    });
  }

  // Удаляем все сессии пользователя (для безопасности):
  static async removeAllUserSessions(userId: string) {
    //Удаляем все записи токенов для данного пользователя:
    return prisma.token.deleteMany({
      where: { userId },
    });
  }
}
