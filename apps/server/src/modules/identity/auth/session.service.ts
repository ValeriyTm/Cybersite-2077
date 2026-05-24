//---------------Сервис для управления сессиями пользователей в базе данных через Prisma---
//Клиент призмы для работы с PostgreSQL:
import { prisma, Role } from "@repo/database";
//Сервисы работы с токенами:
import { tokenService } from "./token.service.js";
//Логирование:
import { logger } from "../../../shared/lib/logger.js";

export class SessionService {
  // Сохраняем новую сессию (токен) в базу:
  async saveToken(userId: string, refreshToken: string) {
    //Если ID пустой, логируем ошибку и прерываем выполнение, чтобы не создать «битую» запись:
    if (!userId) {
      logger.error("SessionService: Попытка сохранить токен без userId!");
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
  async removeToken(refreshToken: string) {
    //Используется deleteMany, чтобы код не «падал» с ошибкой, если токен уже был удален или не найден (например, при двойном клике на кнопку «Выход»):
    return prisma.token.deleteMany({
      where: { refreshToken },
    });
  }

  // Находим токен в базе (нужно для проверки при Refresh):
  async findToken(refreshToken: string) {
    return prisma.token.findUnique({
      where: { refreshToken },
    });
  }

  // Удаляем все сессии пользователя (для безопасности):
  async removeAllUserSessions(userId: string) {
    //Удаляем все записи токенов для данного пользователя:
    return prisma.token.deleteMany({
      where: { userId },
    });
  }

  // Осуществляем ротацию токенов (Refresh Token Rotation):
  async rotateTokens(dto: {
    refreshToken: string;
    id: string;
    email: string;
    role: Role;
    name: string;
  }) {
    //Генерируем новую пару токенов:
    const tokens = tokenService.generateTokens({
      id: dto.id,
      email: dto.email,
      role: dto.role,
      name: dto.name,
    });

    if (!dto.id) {
      logger.error("SessionService: Попытка сохранить токен без userId!");
      throw new Error("Наличие userId обязательно для сохранения токена в БД");
    }

    //Выполняем удаление старого и запись нового токена в единой транзакции:
    await prisma.$transaction([
      //Помечаем старый токен как отозванный:
      prisma.token.update({
        where: { refreshToken: dto.refreshToken },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }),

      prisma.token.create({
        data: {
          refreshToken: tokens.refreshToken,
          userId: dto.id,
        },
      }),
    ]);

    return tokens;
  }
}

export const sessionService = new SessionService();
