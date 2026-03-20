import { prisma } from "@repo/database";

export class SessionService {
  // Сохраняем новую сессию (токен) в базу
  static async saveToken(userId: string, refreshToken: string) {
    // Добавим проверку, чтобы сервер не падал, а выдавал понятную ошибку
    if (!userId) {
      console.error("SessionService: Попытка сохранить токен без userId!");
      throw new Error("userId is required to save token");
    }

    return prisma.token.upsert({
      where: { refreshToken },
      update: { refreshToken },
      create: {
        refreshToken,
        // Используем connect вместо прямой записи userId
        // Это гарантирует, что Prisma правильно обработает связь
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  // Удаляем конкретную сессию (при логауте с одного устройства)
  static async removeToken(refreshToken: string) {
    return prisma.token.deleteMany({
      where: { refreshToken },
    });
  }

  // Находим токен в базе (нужно для проверки при Refresh)
  static async findToken(refreshToken: string) {
    return prisma.token.findUnique({
      where: { refreshToken },
    });
  }

  // Удаляем все сессии пользователя (безопасность)
  static async removeAllUserSessions(userId: string) {
    return prisma.token.deleteMany({
      where: { userId },
    });
  }
}
