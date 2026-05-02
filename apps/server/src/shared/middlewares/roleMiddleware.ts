//-------------------Middleware для авторизации на основе RBAC-------
//---Это middleware будет принимать список разрешенных ролей и проверять, есть ли нужная роль у пользователя в req.user (которую туда положил authMiddleware).
//Типы:
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../utils/catch-async.js";

//При вызове функции в её аргумент помещаем массив разрешенных ролей:
export const roleMiddleware = (allowedRoles: string[]) => {
  return catchAsync(
    async (req: AuthRequest, _res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new AppError(401, "Пользователь не авторизован");
      }

      const { id, role } = req.user;

      if (!allowedRoles.includes(role)) {
        throw new AppError(403, "У вас недостаточно прав для этого действия");
      }

      if (role === "ADMIN" || role === "SUPERADMIN") {
        const dbUser = await prisma.user.findUnique({
          where: { id },
          select: { role: true, isActivated: true },
        });

        if (!dbUser || !["ADMIN", "SUPERADMIN"].includes(dbUser.role)) {
          throw new AppError(
            403,
            "Подтверждение прав администратора не удалось",
          );
        }

        if (!dbUser.isActivated) {
          throw new AppError(403, "Аккаунт администратора не активирован");
        }
      }
      next();
    },
  );
};
