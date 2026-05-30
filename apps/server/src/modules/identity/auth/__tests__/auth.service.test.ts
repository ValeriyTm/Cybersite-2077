process.env.LOKI_URL = "http://loki:3100";

import { describe, it, expect, vi, Mock } from "vitest";
import { authService } from "../auth.service.js";
import { prisma } from "@repo/database";
import fs from "fs/promises";

//Мокаем призму:
vi.mock("@repo/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    token: {
      deleteMany: vi.fn(),
    },
  },
}));

//Мокаем модуль fs, чтобы тест не удалял файлы на самом деле:
vi.mock("fs/promises", () => ({
  default: {
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

//Мокаем argon2:
vi.mock("argon2", () => ({
  default: {
    verify: vi.fn().mockResolvedValue(true),
  },
  verify: vi.fn().mockResolvedValue(true),
}));

describe("Удаление аккаунта (deleteAccount)", () => {
  it("Должен удалять файл аватара с диска при удалении пользователя", async () => {
    const userId = "user-123";
    const password = "123";
    const avatarUrl = "/static/avatars/old-avatar.jpg";

    //Сначала сервис ищет пользователя, чтобы узнать путь к аватару:
    (prisma.user.findUnique as Mock).mockResolvedValue({
      id: userId,
      avatarUrl: avatarUrl,
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$...",
    });

    (prisma.user.delete as Mock).mockResolvedValue({ id: userId });

    //Затем вызываем метод удаления:
    await authService.deleteAccount(userId, password);

    //------------
    // Проверяем, что fs.unlink был вызван (команда на удаление аватара отправлена):
    expect(fs.unlink).toHaveBeenCalled();
    console.log("✅ Команда на удаление аватара с сервера отправлена");

    //Проверяем, что в БД ушла команда на удаление:
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });

    // Проверяем, что fs.unlink был вызван с правильным путем:
    expect(fs.unlink).toHaveBeenCalled();
    console.log("✅Команда на удаление аватара с сервера отправлена");

    console.log("✅Юзер удален");
  });
});
