// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const { authenticator } = require("otplib");

// import QRCode from "qrcode";

// export class TwoFactorService {
//   // 1. Генерируем секрет и QR-код для настройки
//   static async generateSecret(email: string) {
//     // Генерируем уникальный секретный ключ для пользователя
//     const secret = authenticator.generateSecret();

//     // Создаем ссылку для OTP-приложения (Google Authenticator, и т.д.)
//     // Cybersite — это имя твоего сервиса, которое увидит юзер в приложении
//     const otpauth = authenticator.keyuri(email, "Cybersite", secret);

//     // Генерируем QR-код в формате Base64 для фронтенда
//     const qrCodeUrl = await QRCode.toDataURL(otpauth);

//     return { secret, qrCodeUrl };
//   }

//   // 2. Проверяем код (тот, что ввел юзер из приложения)
//   static verifyToken(token: string, secret: string): boolean {
//     return authenticator.verify({ token, secret });
//   }
// }

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// В новых версиях otplib для Node.js 16+ импорт выглядит именно так:
const { authenticator } = require("@otplib/preset-default");

import QRCode from "qrcode";

export class TwoFactorService {
  static async generateSecret(email: string) {
    // Генерируем секрет
    const secret = authenticator.generateSecret();

    // Генерируем otpauth URL (именно этот метод создает строку для QR)
    const otpauth = authenticator.keyuri(email, "Cybersite", secret);

    // Генерируем QR-код
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeUrl };
  }

  static verifyToken(token: string, secret: string): boolean {
    return authenticator.check(token, secret);
  }
}
