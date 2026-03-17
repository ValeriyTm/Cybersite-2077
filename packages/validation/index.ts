import { z } from "zod";

//Схема для регистрации:
export const RegisterSchema = z
  .object({
    //Валидируем email:
    email: z
      .string()
      .trim()
      .toLowerCase()
      //Моя оптимальная регулярка для email:
      .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
        "Введите корректный адрес электронной почты",
      ),

    //Валидируем пароль:
    password: z
      .string()
      .trim()
      .min(8, "Минимум 8 символов")
      .max(32, "Максимум 32 символа")
      // Хотя бы одна заглавная буква
      .regex(/[A-Z]/, "Нужна хотя бы одна заглавная буква")
      // Хотя бы одна строчная буква
      .regex(/[a-z]/, "Нужна хотя бы одна строчная буква")
      // Хотя бы одна цифра
      .regex(/[0-9]/, "Нужна хотя бы одна цифра")
      // Хотя бы один спецсимвол
      .regex(/[^a-zA-Z0-9]/, "Нужен хотя бы один спецсимвол (@, #, $ и т.д.)"),

    //Валидируем имя (логин):
    name: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, { message: "Имя слишком короткое" })
      .max(20, "Максимум 20 символов")
      .regex(
        /^[a-z0-9_]+$/,
        "Используйте только латиницу, цифры и нижнее подчеркивание",
      ),
  })
  .superRefine(({ name, password }, ctx) => {
    if (password.toLowerCase().includes(name.toLowerCase())) {
      ctx.addIssue({
        code: "custom",
        message: "Пароль не должен содержать ваше имя",
        path: ["password"],
      });
    }
  });
//В superRefine происходит сверка имени и пароля; если в пароле есть имя, то это будет ошибкой.

//Создаём тип для регистрации на основе схемы:
export type RegisterInput = z.infer<typeof RegisterSchema>;

//-----------------------------------------------------------------

//Схема для логина:
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Некорректный email или пароль" }),
  //При входе в систему нам не нужна строгая регулярка (которую мы ставили на регистрацию). Нам достаточно встроенной проверки Zod, чтобы просто отсечь совсем некорректные строки.

  password: z.string().min(1, { message: "Введите пароль" }),
});

//Создаём тип для входа на основе схемы:
export type LoginInput = z.infer<typeof LoginSchema>;
