import { describe, it, expect, vi, beforeEach } from "vitest";
import { CleanupService } from "../cleanup.service.js";
import { prisma } from "@repo/database";

//Мокаем призму:
vi.mock("@repo/database", () => ({
  prisma: {
    user: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

describe("Проверяем CleanupService (автоудаление неподтвержденного аккаунта)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Включаем "машину времени"
  });

  it("должен вызывать удаление только для старых неактивированных аккаунтов", async () => {
    //Устанавливаем "текущую дату" в 20.03.2024:
    const today = new Date("2024-03-20T12:00:00Z");
    vi.setSystemTime(today);

    //Вычисляем дату в 7 дней назад от "текущей":
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - 7);

    //Запускаем сервис очистки:
    await CleanupService.deleteUnactivatedAccounts();

    // Сервис должен вызвать deleteMany с фильтром:
    // создано меньше (раньше) чем sevenDaysAgo И isActivated: false
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: {
        isActivated: false,
        createdAt: {
          lt: expectedDate,
        },
      },
    });

    console.log(
      "✅ Сервис удаления неподтвержденных аккаунтов работает корректно!",
    );
  });
});
