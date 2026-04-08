import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { eventBus, EVENTS } from "src/shared/lib/eventBus.js";
import axios from "axios";
import { RecaptchaService } from "src/shared/services/recaptcha.service.js";
import { AppError } from "src/shared/utils/app-error.js";
import { createTicketSchema } from "@repo/validation";
import fs from "fs";
import { scheduleTicketCleanup } from "./support.queue.js";

//Создание запроса от юзера:
export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("req.body: ", req.body);
    //1) Процесс валидации:
    const validation = createTicketSchema.safeParse(req.body);
    if (!validation.success) {
      console.log("Валидация провалилась!");
      // Если есть прикрепленные файлы, а валидация не прошла — удаляем их, чтобы не засорять сервер
      if (req.files) {
        (req.files as Express.Multer.File[]).forEach((file) =>
          fs.unlinkSync(file.path),
        );
      }
      return res.status(400).json({
        message: "Ошибка валидации",
        errors: validation.error.flatten().fieldErrors,
      });
    }
    console.log("validation: ", validation);
    //2) Извлекаем данные:
    const {
      firstName,
      lastName,
      email,
      phone,
      category,
      description,
      captchaToken,
    } = validation.data;
    const userId = (req as any).user?.id; // Если юзер авторизован

    const isHuman = await RecaptchaService.verify(captchaToken);
    if (!isHuman) {
      throw new AppError(
        403,
        "Ошибка безопасности: проверка reCAPTCHA не пройдена",
      );
    }

    // 2. Создание тикета и сохранение файлов в транзакции
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          userId,
          firstName,
          lastName,
          email,
          phone,
          category,
          description,
          attachments: {
            create:
              (req.files as Express.Multer.File[])?.map((file) => ({
                fileUrl: file.path,
                fileType: file.mimetype,
                originalName: file.originalname,
                size: file.size,
              })) || [],
          },
        },
        include: { attachments: true },
      });
      return newTicket;
    });

    // 3. Отправляем событие в EventBus (для уведомления в Telegram)
    eventBus.emit(EVENTS.SUPPORT_TICKET_CREATED, ticket);

    res
      .status(201)
      .json({ message: "Обращение успешно отправлено", ticketId: ticket.id });
  } catch (error) {
    next(error);
  }
};

//Обновление статуса запроса:
export const updateTicketStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
  });

  //Если статус CLOSED — ставим задачу на удаление в очередь
  if (status === "CLOSED" || status === "RESOLVED") {
    await scheduleTicketCleanup(ticket.id);
  }

  res.json(ticket);
};

//Получить тикеты текущего юзера:
export const getUserTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: { attachments: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};
