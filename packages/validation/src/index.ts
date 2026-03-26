import { z } from "zod";

//-----------------Схемы для регистрации:---------------------//

//Схема для регистрации, которая будет использоваться на бэкенде:
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
      .min(8, "Пароль должен иметь минимум 8 символов")
      .max(32, "Пароль должен иметь максимум 32 символа")
      // Хотя бы одна заглавная буква
      .regex(/[A-Z]/, "В пароле нужна хотя бы одна заглавная буква")
      // Хотя бы одна строчная буква
      .regex(/[a-z]/, "В пароле нужна хотя бы одна строчная буква")
      // Хотя бы одна цифра
      .regex(/[0-9]/, "В пароле нужна хотя бы одна цифра")
      // Хотя бы один спецсимвол
      .regex(
        /[^a-zA-Z0-9]/,
        "В пароле нужен хотя бы один спецсимвол (@, #, $ и т.д.)",
      ),

    //Валидируем имя (логин):
    name: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, { message: "Имя слишком короткое" })
      .max(20, "Максимум 20 символов для имени")
      .regex(
        /^[a-z0-9_]+$/,
        "Для имени используйте только латиницу, цифры и нижнее подчеркивание",
      ),
    // Добавляем обязательное поле для токена
    captchaToken: z.string({ required_error: "Ошибка безопасности" }),
  })
  .strict();

//Схема для регистрации, которая будет использоваться на фронтенде:
export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string().min(1, "Подтвердите пароль"),
  acceptTerms: z.literal(true, {
    message: "Нужно ваше согласие на обработку данных", // Просто меняем errorMap на message
  }),
})
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Введенные пароли не совпадают",
    path: ["confirmPassword"],
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

//Создаём тип для регистрации на основе схемы (для backend):
export type RegisterInput = z.infer<typeof RegisterSchema>;
//Создаём тип для регистрации на основе схемы (для frontend):
export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;
//---------------------------------------------------------
//-----------------Схемы для логина:---------------------//
//Схема для логина:
export const LoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: "Некорректный email или пароль" }),
    //При входе в систему нам не нужна строгая регулярка (которую мы ставили на регистрацию). Нам достаточно встроенной проверки Zod, чтобы просто отсечь совсем некорректные строки.

    password: z.string().min(8, { message: "Некорректный email или пароль" }),

    rememberMe: z.boolean().optional().default(false), // Поле для чекбокса "Запомнить меня"
    // Добавляем обязательное поле для токена
    captchaToken: z.string({ required_error: "Ошибка безопасности" }),
  })
  .strict();

//Создаём тип для входа на основе схемы:
export type LoginInput = z.infer<typeof LoginSchema>;
//---------------------------------------------------------
//-----------------Прочие схемы:---------------------//
//Схема для добавления дополнительных данных о пользователе:
export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, { message: "Имя слишком короткое" })
      .max(20, "Максимум 20 символов для имени")
      .regex(
        /^[a-z0-9_]+$/,
        "Для имени используйте только латиницу, цифры и нижнее подчеркивание",
      )
      .optional(), //Говорит, что параметр не обязательный
    phone: z
      .string()
      .trim()
      //Телефон: Необязательный "+"" в начале. Первая цифра от 1 до 9. Всего от 2 до 15 цифр (международный стандарт E.164):
      .regex(
        /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
        "Введите корректный номер телефона",
      )
      .nullish(),

    birthday: z.coerce
      .date({
        invalid_type_error: "Введите корректную дату",
      })
      .max(new Date(), "Дата не может быть в будущем")
      .nullable()
      .optional(),
    gender: z
      .preprocess(
        (val) => (val === "" ? null : val), // Если пришла пустая строка — превращаем в null
        z.enum(["MALE", "FEMALE"]).nullable(), // Разрешаем null
      )
      .optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

//Схема для смены пароля:
export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
      .string()
      .trim()
      .min(8, "Пароль должен иметь минимум 8 символов")
      .max(32, "Пароль должен иметь максимум 32 символа")
      // Хотя бы одна заглавная буква
      .regex(/[A-Z]/, "В пароле нужна хотя бы одна заглавная буква")
      // Хотя бы одна строчная буква
      .regex(/[a-z]/, "В пароле нужна хотя бы одна строчная буква")
      // Хотя бы одна цифра
      .regex(/[0-9]/, "В пароле нужна хотя бы одна цифра")
      // Хотя бы один спецсимвол
      .regex(
        /[^a-zA-Z0-9]/,
        "В пароле нужен хотя бы один спецсимвол (@, #, $ и т.д.)",
      ),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

//Схема для валидации введенного email (Forgot Password):
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Некорректный email или пароль" }),
  captchaToken: z.string({ required_error: "Ошибка безопасности" }),
});

//Схема для обновления пароля (Forgot Password):
export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(8, "Пароль должен иметь минимум 8 символов")
      .max(32, "Пароль должен иметь максимум 32 символа")
      // Хотя бы одна заглавная буква
      .regex(/[A-Z]/, "В пароле нужна хотя бы одна заглавная буква")
      // Хотя бы одна строчная буква
      .regex(/[a-z]/, "В пароле нужна хотя бы одна строчная буква")
      // Хотя бы одна цифра
      .regex(/[0-9]/, "В пароле нужна хотя бы одна цифра")
      // Хотя бы один спецсимвол
      .regex(
        /[^a-zA-Z0-9]/,
        "В пароле нужен хотя бы один спецсимвол (@, #, $ и т.д.)",
      ),
    confirmPassword: z.string(),
    captchaToken: z.string({ required_error: "Ошибка безопасности" }),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

///////Схема для валидации 2FA кода:
export const Verify2FASchema = z
  .object({
    userId: z.string().uuid("Некорректный формат ID"), // Проверяем, что это UUID
    code: z
      .string()
      .length(6, "Код должен содержать 6 цифр")
      .regex(/^\d+$/, "Код должен состоять только из цифр"),
  })
  .strict(); // Обязательно strict, чтобы не пролезло лишнего

///////Схема для удаления аккаунта:
export const DeleteAccountSchema = z.object({
  confirmPassword: z.string().min(1, "Введите пароль для подтверждения"),
});

export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
