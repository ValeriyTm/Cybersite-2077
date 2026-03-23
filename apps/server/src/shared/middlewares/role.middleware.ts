//-------------------Middleware для авторизации на основе RBAC-------
// Это middleware будет принимать список разрешенных ролей и проверять, есть ли нужная роль у пользователя в req.user (которую туда положил authMiddleware).
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../utils/app-error.js";

//При вызове функции в её аргумент помещаем массив разрешенных ролей:
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Проверяем, авторизован ли юзер вообще:
    if (!req.user) {
      throw new AppError(401, "Пользователь не авторизован");
    }

    // 2. Проверяем, входит ли роль юзера в список разрешенных:
    //(проверяем установленные роли и роль пользователя)
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, "У вас недостаточно прав для этого действия");
    }

    next();
  };
};
