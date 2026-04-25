//Типы:
import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middlewares/auth.middleware.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Схемы валидации Zod:
import { createTicketSchema } from "@repo/validation";
//Главный сервис модуля Support:
import { supportService } from "./support.service.js";
//Сервис для reCaptcha v3:
import { recaptchaService } from "../../shared/services/recaptcha.service.js";
//Очередь для удаления закрытых тикетов:
import { scheduleTicketCleanup } from "./support.queue.js";
//Для генерации события:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Для удаления прикрепленных файлов:
import fs from "fs/promises";

//Создание тикета поддержки от юзера:
export const createTicket = catchAsync(
  async (req: AuthRequest, res: Response) => {
    //1) Процесс валидации Zod:
    const validation = createTicketSchema.safeParse(req.body);
    if (!validation.success) {
      console.log("Валидация провалилась!");

      //Если есть прикрепленные файлы, а валидация не прошла — удаляем их, чтобы не засорять сервер:
      if (req.files) {
        const files = req.files as Express.Multer.File[]; //Явно типизируем

        //Запускаем все удаления параллельно и не блокируем поток:
        const deletePromises = files.map((file) =>
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs
            .unlink(file.path)
            // Используем catch, чтобы ошибка удаления одного файла не обвалила весь процесс
            .catch((err) =>
              console.error(
                `Ошибка удаления временного файла: ${file.path}`,
                err,
              ),
            ),
        );
        // Ждем завершения удалений перед ответом (или можно не ждать, если файлы не критичны)
        await Promise.all(deletePromises);
      }
      return res.status(400).json({
        message: "Ошибка валидации",
        // eslint-disable-next-line
        // @ts-ignore:
        errors: validation.error.flatten().fieldErrors,
      });
    }

    //2) Извлекаем данные для проверки капчи и необходимости удаления файлов:
    const { captchaToken } = validation.data;
    const userId = (req as any).user?.id; // Если юзер авторизован

    //3) Работаем с файлами:
    const files = req.files as Express.Multer.File[]; //Явно типизируем
    //Удаляем прикрепленные файлы, если юзер не авторизован:
    if (files && files.length > 0 && !userId) {
      //Удаляем прикрепленные файлы:
      (req.files as Express.Multer.File[]).forEach((file) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlink(file.path).catch((err) =>
          console.error(`Ошибка удаления временного файла: ${file.path}`, err),
        );
      });

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
      userId: req.user?.id, // Если авторизован
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone, // Опционально
      category: req.body.category,
      description: req.body.description,
      files: req.files as Express.Multer.File[], // Опционально
    });

    //6) Отправляем событие в EventBus (для уведомления в Telegram):
    eventBus.emit(EVENTS.SUPPORT_TICKET_CREATED, ticket);

    res
      .status(201)
      .json({ message: "Обращение успешно отправлено", ticketId: ticket.id });
  },
);

//Обновление статуса тикета:
export const updateTicketStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    //Обновляем статус тикета в БД:
    // @ts-ignore:
    const ticket = await supportService.updateTicketStatus(id, status);

    //Если статус CLOSED или RESOLVED — ставим задачу на удаление в очередь:
    if (status === "CLOSED" || status === "RESOLVED") {
      await scheduleTicketCleanup(ticket.id);
    }

    res.json(ticket);
  },
);

//Получить тикеты поддержки текущего юзера:
export const getUserTickets = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    //Получаем тикеты юзера из БД:
    const tickets = await supportService.getUserTickets(userId);

    res.json(tickets);
  },
);
