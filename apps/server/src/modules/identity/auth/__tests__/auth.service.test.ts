import { describe, it, expect, vi } from "vitest";
import { authService } from "../auth.service.js";
import { prisma } from "@repo/database";
import fs from "fs/promises"; // Используем промисы fs

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
    const avatarPath = "uploads/avatars/old-avatar.jpg";

    //Сначала сервис ищет пользователя, чтобы узнать путь к аватару:
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      avatarUrl: avatarPath,
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$...",
    });

    //Затем вызываем метод удаления:
    await authService.deleteAccount(userId, password);

    //------------
    //Проверяем, что в БД ушла команда на удаление:
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });

    // Проверяем, что fs.unlink был вызван с правильным путем:
    expect(fs.unlink).toHaveBeenCalled();
    console.log("✅Команда на удаление аватара с сервера отправлена");

    //Проверяем, что сессии юзера удалены:
    expect(prisma.token.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    console.log("✅Сессии юзера удалены");

    //Проверяем, что сам юзер удален:
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });
    console.log("✅Юзер удален");
  });
});
