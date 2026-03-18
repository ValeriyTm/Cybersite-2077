//Тут связь с HTTP. Этот код принимает запросы от клиентов, направляет их в сервис; отправляет ответ клиентам

import { Request, Response } from "express";
import { RegisterSchema } from "@repo/validation";
import { AuthService } from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
  //Валидация запроса при помощи Zod:
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  try {
    const user = await AuthService.register(result.data);
    res.status(201).json({
      message: "Пользователь создан!",
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    if (error.message === "USER_ALREADY_EXISTS") {
      //Мог бы написать "Этот email уже занят, но это не безопасно"
      return res.status(400).json({ message: "Неправильный email или пароль" });
    }
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const activate = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    await AuthService.activate(token);
    // После редиректим пользователя на фронтенд:
    return res.redirect(`${process.env.CLIENT_URL}/login?activated=true`);
  } catch (e) {
    res.status(400).send("Ссылка недействительна");
  }
};
