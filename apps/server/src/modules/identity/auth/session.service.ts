import { prisma } from "@repo/database";

export class SessionService {
  // Сохраняем новую сессию (токен) в базу
  static async saveToken(userId: string, refreshToken: string) {
    return prisma.token.create({
      data: { userId, refreshToken },
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
