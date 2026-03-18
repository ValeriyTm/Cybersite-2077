//Сервис для работы с почтой
import nodemailer from "nodemailer";

// Настройки из твоего .env (используй App Password от Google)
const transporter = nodemailer.createTransport({
  service: "gmail",
  //В старом коде вместо service: "gmail" я бы написал так:
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export class MailService {
  static async sendActivationMail(to: string, link: string) {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject: "Активация аккаунта на " + process.env.API_URL,
      text: "",
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h1>Добро пожаловать на Cybersite-2077!</h1>
        <p>Благодарим за регистрацию. Для завершения создания аккаунта, пожалуйста, подтвердите ваш email:</p>
        <div style="margin: 20px 0;">
            <a href="${link}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
               Подтвердить регистрацию
            </a>
        </div>
        <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; pt: 15px;">
            Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо и не переходите по ссылке. 
            Ваши данные в безопасности.
        </p>
        </div>
      `,
    });
  }
}
