//-------------------Middleware для авторизации на основе RBAC-------
// Это middleware будет принимать список разрешенных ролей и проверять, есть ли нужная роль у пользователя в req.user (которую туда положил authMiddleware).
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../utils/app-error.js";
import { prisma } from "@repo/database";

//При вызове функции в её аргумент помещаем массив разрешенных ролей:
export const roleMiddleware = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Проверяем, авторизован ли юзер вообще:
    if (!req.user) {
      throw new AppError(401, "Пользователь не авторизован");
    }

    const { id, role } = req.user;

    // 2. Проверяем, входит ли роль юзера в список разрешенных (берем данные из токена юзера):
    //(проверяем установленные роли и роль пользователя)
    if (!allowedRoles.includes(role)) {
      throw new AppError(403, "У вас недостаточно прав для этого действия");
    }

    // 3.Дополнительная проверка в БД для админов:
    if (role === "ADMIN" || role === "SUPERADMIN") {
      // Если юзер заявляет, что он админ — идем проверять это в PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true, isActivated: true },
      });

      //Если юзера нет, он не активирован или его роль в уже БД изменилась (например, отозвали, а в access token роль старая):
      if (!dbUser || !["ADMIN", "SUPERADMIN"].includes(dbUser.role)) {
        return next(
          new AppError(403, "Подтверждение прав администратора не удалось"),
        );
      }

      // Дополнительно можно проверить статус активации
      if (!dbUser.isActivated) {
        return next(new AppError(403, "Аккаунт администратора не активирован"));
      }
    }

    next();
  };
};
