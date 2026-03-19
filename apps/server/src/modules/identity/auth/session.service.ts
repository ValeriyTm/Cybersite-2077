import { prisma } from "@repo/database";

export class SessionService {
  // Сохраняем новую сессию (токен) в базу
  static async saveToken(userId: string, refreshToken: string) {
    // Используем upsert, чтобы гарантировать отсутствие дубликатов по самому токену
    return prisma.token.upsert({
      where: { refreshToken }, // Если такой токен уже существует
      update: { refreshToken }, // Просто "обновляем" его тем же значением
      create: { userId, refreshToken }, // Если нет — создаем новую сессию
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
