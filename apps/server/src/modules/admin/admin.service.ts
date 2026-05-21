//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";

export class AdminService {
  //---------------------Работа с остатками:-------------
  //Получение всех остатков:
  async getStocks(motoId: string) {
    return await prisma.stock.findMany({
      where: {
        motorcycleId: motoId ? String(motoId) : undefined,
      },
      include: {
        motorcycle: { select: { model: true } },
        warehouse: { select: { name: true, city: true } },
      },
      orderBy: { warehouse: { name: "asc" } },
    });
  }

  //Обновление остатков:
  async updateStock(id: string, quantity: number) {
    return await prisma.stock.update({
      where: { id },
      data: { quantity },
      select: { motorcycleId: true },
    });
  }

  //---------------------Управление доступом:-------------
  //Получить данные о юзерах:
  async getUsers(role: string, email: string, skip: number, limit: number) {
    const where: any = {};
    if (role) where.role = role;
    if (email) where.email = { contains: String(email), mode: "insensitive" };

    return await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          //  Не берем пароли и секреты
          id: true,
          email: true,
          name: true,
          phone: true,
          isActivated: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
  }

  //Изменить роль юзеру:
  async updateUserRole(id: string, role: string) {
    return await prisma.user.update({
      where: { id },
      //@ts-ignore:
      data: { role },
    });
  }

  //Удалить юзера:
  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
  }
}

export const adminService = new AdminService();
