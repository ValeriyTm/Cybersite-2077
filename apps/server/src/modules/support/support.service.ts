//Клиент призмы для работы с PostgreSQL:
import { prisma, TicketCategory, TicketStatus } from "@repo/database";
import { Prisma } from "@repo/database/generated/prisma";
//Очередь для удаления закрытых тикетов:
import { scheduleTicketCleanup } from "./support.queue.js";

interface CreateTicketDto {
  firstName: string;
  lastName: string;
  email: string;
  category: TicketCategory;
  description: string;
  phone?: string; // Опционально
  userId?: string; // Опционально
  files?: Express.Multer.File[]; // Опционально
}

export class SupportService {
  //Создание тикета и сохранение файлов:
  async createTicket(dto: CreateTicketDto) {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      category,
      description,
      files,
    } = dto;

    return await prisma.supportTicket.create({
      data: {
        userId, // Присвоится только если есть
        firstName,
        lastName,
        email,
        phone, // Присвоится только если есть
        category,
        description,
        attachments: {
          create:
            files?.map((file) => ({
              fileUrl: file.filename,
              fileType: file.mimetype,
              originalName: file.originalname,
              size: file.size,
            })) || [], // Присвоится только если есть
        },
      },
      include: { attachments: true },
    });
  }

  //Получить тикеты поддержки текущего юзера:
  async getUserTickets(userId: string) {
    return await prisma.supportTicket.findMany({
      where: { userId },
      include: { attachments: true },
      orderBy: { createdAt: "desc" },
    });
  }

  //Изменить статус тикета:
  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status },
    });

    //Если статус CLOSED или RESOLVED — ставим задачу на удаление в очередь:
    if (status === "CLOSED" || status === "RESOLVED") {
      await scheduleTicketCleanup(ticket.id);
    }

    return ticket;
  }

  //Получение всех тикетов:
  async getTickets(
    skip: number,
    limit: number,
    status?: TicketStatus,
    email?: string,
  ) {
    const where: Prisma.SupportTicketWhereInput = {};
    if (status) where.status = status;
    if (email) {
      where.email = { contains: String(email), mode: "insensitive" };
    }

    return await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          attachments: true,
          user: { select: { email: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.count({ where }),
    ]);
  }

  //Дать ответ на тикет:
  async replyToTicket(id: string, answer: string) {
    return await prisma.supportTicket.update({
      where: { id },
      data: {
        answer,
        status: "RESOLVED",
        answeredAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

export const supportService = new SupportService();
