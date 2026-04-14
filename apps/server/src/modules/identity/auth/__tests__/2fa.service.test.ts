import { describe, it, expect, vi, afterEach } from "vitest";
import { twoFactorService } from "../two-factor.service.js";

//Используем рабочий способ получения authenticator из otplib:
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { authenticator } = require("@otplib/preset-default");

describe("Тестируем 2FA (сервис TwoFactorService)", () => {
  //Сбрасываем шпионов после каждого теста:
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Должно возвращаться true при правильном коде", () => {
    const token = "123456";
    const secret = "MY_SECRET_KEY";

    //spyOn захватывает метод check у реального authenticator:
    vi.spyOn(authenticator, "check").mockReturnValue(true);

    //Вызываем настоящий метод, он лезет в authenticator.check, а там шпион ему отдаёт результат true.
    const isValid = twoFactorService.verifyToken(token, secret);

    expect(isValid).toBe(true);
    //Проверяем, что шпион был вызван:
    expect(authenticator.check).toHaveBeenCalledWith(token, secret);
  });

  it("Должно возвращаться false при неверном коде", () => {
    vi.spyOn(authenticator, "check").mockReturnValue(false);

    const isValid = twoFactorService.verifyToken("000000", "SECRET");

    expect(isValid).toBe(false);
  });
});
