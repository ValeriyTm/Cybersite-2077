////-------------------------Сервис для реализации 2FA------------
//Используем старый формат библиотек (require) в современном проекте на ES-модулях (import/export):
import { createRequire } from "module"; // Поскольку проект использует ESM, то обычного require в нем нет, а эта функция создает его вручную.
const require = createRequire(import.meta.url); //Создаём require относительно этого файла.

//Подключаем ядро для работы с OTP (One-Time Password):
const { authenticator } = require("@otplib/preset-default");
//В новых версиях otplib для Node.js 16+ импорт выглядит именно так.

//Библиотека для превращения текста в картинку QR-кода:
import QRCode from "qrcode";

export class TwoFactorService {
  //Метод для настройки 2FA (генерации QR):
  static async generateSecret(email: string) {
    //Создаем уникальный случайный ключ (секрет), который будет храниться в БД для конкретного пользователя:
    const secret = authenticator.generateSecret();

    //Генерируем otpauth URL (этот метод создает строку для QR):
    const otpauth = authenticator.keyuri(email, "Cybersite", secret);

    //Генерируем QR-код:
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    //Возвращаем секрет (для записи в БД) и картинку (для показа пользователю):
    return { secret, qrCodeUrl };
  }

  //Метод для проверки 6-значного кода, введенного пользователем:
  static verifyToken(token: string, secret: string): boolean {
    //Берем секрет из БД и текущее время, вычисляет, какие 6 цифр должны быть сейчас на экране у пользователя,
    //и сравнивает их с присланным token. Возвращает true или false:
    return authenticator.check(token, secret);
  }
}
