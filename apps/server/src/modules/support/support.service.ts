//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";

enum TicketCategory {
  TECHNICAL,
  ORDER,
  COOPERATION,
  COMPLAINT,
  OTHER,
}

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
  //Создание тикета и сохранение файлов в транзакции:
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

    return await prisma.$transaction(async (tx) => {
      return await tx.supportTicket.create({
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
    });
  }

  //Обновление статуса тикета:
  async updateTicketStatus(id: string, status: string) {
    return await prisma.supportTicket.update({
      where: { id },
      data: { status },
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
}

export const supportService = new SupportService();
