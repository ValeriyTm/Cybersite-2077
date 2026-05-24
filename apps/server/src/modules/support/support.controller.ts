//Типы:
import { Response } from "express";
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Схемы валидации Zod:
import { createTicketServiceArgs } from "@repo/validation";
//Главный сервис модуля Support:
import { supportService } from "./support.service.js";
//Сервис для reCaptcha v3:
import { recaptchaService } from "../../shared/services/recaptcha.service.js";
//Для генерации события:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Для удаления прикрепленных файлов:
import fs from "fs/promises";
//Логирование:
import { logger } from "src/shared/lib/logger.js";

//Создание тикета поддержки от юзера:
export const createTicket = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const {
      captchaToken,
      firstName,
      lastName,
      email,
      phone,
      category,
      description,
    } = req.body as createTicketServiceArgs;
    const userId = req.user?.id; // Если юзер авторизован
    const files = req.files as Express.Multer.File[];

    // Функция-хелпер для очистки файлов внутри контроллера при бизнес-ошибках
    const cleanUploadedFiles = async () => {
      if (files && files.length > 0) {
        await Promise.all(
          files.map((file) =>
            //Eslint ругается, т.к. не знает, что мы формируем путь на сервере, а не на клиенте, поэтому:
            //eslint-disable-next-line security/detect-non-literal-fs-filename
            fs
              .unlink(file.path)
              .catch((err) =>
                logger.error(`Ошибка удаления файла: ${file.path}`, err),
              ),
          ),
        );
      }
    };

    //Удаляем прикрепленные файлы, если юзер не авторизован:
    if (files && files.length > 0 && !userId) {
      await cleanUploadedFiles();
      return res.status(403).json({
        message: "Загрузка файлов доступна только авторизованным пользователям",
      });
    }

    //4) Проверка капчи:
    const isHuman = await recaptchaService.verify(captchaToken);
    if (!isHuman) {
      throw new AppError(
        403,
        "Ошибка безопасности: проверка reCAPTCHA не пройдена",
      );
    }

    //5) Записываем данные тикета в БД:
    const ticket = await supportService.createTicket({
      userId,
      firstName,
      lastName,
      email,
      phone,
      category,
      description,
      files,
    });

    //6) Отправляем событие в EventBus (для уведомления в Telegram):
    eventBus.emit(EVENTS.SUPPORT_TICKET_CREATED, ticket);

    res
      .status(201)
      .json({ message: "Обращение успешно отправлено", ticketId: ticket.id });
  },
);

//Получить тикеты поддержки текущего юзера:
export const getUserTickets = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    //Получаем тикеты юзера из БД:
    const tickets = await supportService.getUserTickets(userId);

    res.json(tickets);
  },
);
