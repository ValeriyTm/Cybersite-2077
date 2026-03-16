import { z } from "zod";

//Схема для регистрации:
export const RegisterSchema = z.object({
  // Явно указываем объект с сообщением
  email: z.string().email({ message: "Некорректный email" }),
  password: z
    .string()
    .min(8, { message: "Пароль должен быть не менее 8 символов" }),
  name: z.string().min(2, { message: "Имя слишком короткое" }),
});

//Тип на основе схемы:
export type RegisterInput = z.infer<typeof RegisterSchema>;

//Схема для логина:
export const LoginSchema = z.object({
  email: z.string().email({ message: "Некорректный email" }),
  password: z.string().min(1, { message: "Введите пароль" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
