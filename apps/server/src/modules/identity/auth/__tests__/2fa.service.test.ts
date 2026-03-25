// import { describe, it, expect, vi } from "vitest";
// import { TwoFactorService } from "../two-factor.service.js"; // Проверь путь

// //Используем старый формат библиотек (require) в современном проекте на ES-модулях (import/export):
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// //Подключаем ядро для работы с OTP (One-Time Password):
// const { authenticator } = require("@otplib/preset-default");
// //В новых версиях otplib для Node.js 16+ импорт выглядит именно так.

// //Мокаем метод check, который вызывается в сервисе:
// vi.mock("otplib", () => ({
//   authenticator: {
//     check: vi.fn(),
//   },
// }));

// describe("TwoFactorService - проверка кода", () => {
//   it("Должно возвращаться true при правильном коде", () => {
//     const token = "123456";
//     const secret = "MY_SECRET_KEY";

//     //Мокаем check:
//     vi.mocked(authenticator.check).mockReturnValue(true);

//     const isValid = TwoFactorService.verifyToken(token, secret);

//     expect(isValid).toBe(true);

//     //Проверяем вызов check:
//     expect(authenticator.check).toHaveBeenCalledWith(token, secret);
//   });

//   it("Должно возвращаться false при неверном коде", () => {
//     vi.mocked(authenticator.check).mockReturnValue(false);

//     const isValid = TwoFactorService.verifyToken("000000", "SECRET");

//     expect(isValid).toBe(false);
//   });
// });

import { describe, it, expect, vi } from "vitest";
import { TwoFactorService } from "../two-factor.service.js";
// 1. Используем обычный импорт, чтобы Vitest мог его мокнуть
import { authenticator } from "otplib";

// 2. Мокаем модуль otplib целиком
vi.mock("otplib", () => ({
  authenticator: {
    check: vi.fn(),
  },
}));

describe("TwoFactorService - проверка кода", () => {
  it("Должно возвращаться true при правильном коде", () => {
    const token = "123456";
    const secret = "MY_SECRET_KEY";

    // 3. Теперь vi.mocked сработает, так как authenticator.check — это vi.fn()
    vi.mocked(authenticator.check).mockReturnValue(true);

    const isValid = TwoFactorService.verifyToken(token, secret);

    expect(isValid).toBe(true);
    expect(authenticator.check).toHaveBeenCalledWith(token, secret);
  });

  it("Должно возвращаться false при неверном коде", () => {
    vi.mocked(authenticator.check).mockReturnValue(false);

    const isValid = TwoFactorService.verifyToken("000000", "SECRET");

    expect(isValid).toBe(false);
  });
});
