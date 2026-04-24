import { describe, it, expect, vi } from "vitest";
import { sessionService } from "../session.service.js";
import { prisma } from "@repo/database";

//Имитируем работу Prisma, чтобы не лезть в реальную БД:
vi.mock("@repo/database", () => ({
  prisma: {
    token: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("Логика выхода из аккаунта (logout / logoutAll)", () => {
  it("(Logout) Должно вызываться удаление токена юзера из БД при выходе", async () => {
    const refreshToken = "fake-refresh-token";

    // Вызываем метод выхода:
    await sessionService.removeToken(refreshToken);

    expect(prisma.token.deleteMany).toHaveBeenCalledWith({
      where: { refreshToken },
    });
  });

  it("(LogoutAll) Должно вызываться удаление всех токенов юзера из БД при выходе", async () => {
    const userId = "user-123";

    // Вызываем метод выхода:
    await sessionService.removeAllUserSessions(userId);

    expect(prisma.token.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
  });
});
