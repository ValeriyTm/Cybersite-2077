//-----------Сервис для работы с почтой
//Библиотека для отправки электронных писем:
import nodemailer from "nodemailer";

// Настройки из .env (использую App Password от Google):
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
  //Метод отправки ссылки активации:
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

  //Метод отправки письма с сылкой восстановления пароля:
  static async sendResetPasswordMail(to: string, link: string) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `Восстановление пароля на ${process.env.CLIENT_URL}`,
      text: "",
      html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #333;">Забыли пароль?</h2>
        <p>Ничего страшного, это случается с лучшими из нас. Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" 
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Сбросить пароль
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">Эта ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">Если кнопка не работает, скопируйте эту ссылку в браузер: <br/> ${link}</p>
      </div>
    `,
    });
  }
}
