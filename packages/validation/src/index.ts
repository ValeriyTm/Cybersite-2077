import { z } from "zod";

////-----------------------------------------------------------------------------------------------////
////--------------------------1) Модуль Auth-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------1.1) Схема для регистрации:--------------------------------------------//
//----------------------------1.1.1)Схема для регистрации, которая будет использоваться на бэкенде:
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
    //@ts-ignore:
    captchaToken: z.string({ required_error: "Ошибка безопасности" }), // Добавляем обязательное поле для токена
  })
  .strict();

//----------------------1.1.2)Схема для регистрации, которая будет использоваться на фронтенде:
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
        //В superRefine происходит сверка имени и пароля; если в пароле есть имя, то это будет ошибкой.
      });
    }
  });

//Создаём тип для регистрации на основе схемы (для backend):
export type RegisterInput = z.infer<typeof RegisterSchema>;
//Создаём тип для регистрации на основе схемы (для frontend):
export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;

//----------------------------1.2) Схема для логина:--------------------------------------------//
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
    //@ts-ignore:
    captchaToken: z.string({ required_error: "Ошибка безопасности" }), // Добавляем обязательное поле для токена
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
      ),
    phone: z
      .string()
      .trim()
      //Телефон: Необязательный "+"" в начале. Первая цифра от 1 до 9. Всего от 2 до 15 цифр (международный стандарт E.164):
      .regex(
        /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
        "Введите корректный номер телефона",
      )
      .nullable(),

    birthday: z.coerce
      .date({
        //@ts-ignore:
        invalid_type_error: "Введите корректную дату",
      })
      .max(new Date(), "Дата не может быть в будущем")
      .nullable(),
    gender: z.preprocess(
      (val) => (val === "" ? null : val), // Если пришла пустая строка — превращаем в null
      z.enum(["MALE", "FEMALE"]).nullable(), // Разрешаем null
    ),
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
  //@ts-ignore:
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
    //@ts-ignore:
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

//-----------------Схемы для формы поддержки:---------------------//
export const createTicketSchema = z.object({
  firstName: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, { message: "Имя слишком короткое" })
    .max(20, "Максимум 20 символов для имени")
    .regex(/^[а-яёА-ЯЁ]+$/, "Для имени используйте только русские буквы"),
  lastName: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, { message: "Фамилия слишком короткая" })
    .max(30, "Максимум 30 символов для фамилии")
    .regex(/^[а-яёА-ЯЁ]+$/, "Для фамилии используйте только русские буквы"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    //Моя оптимальная регулярка для email:
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      "Введите корректный адрес электронной почты",
    ),
  phone: z
    .string()
    .trim()
    //Телефон: Необязательный "+"" в начале. Первая цифра от 1 до 9. Всего от 2 до 15 цифр (международный стандарт E.164):
    .regex(
      /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
      "Введите корректный номер телефона",
    ),
  //@ts-ignore:
  category: z.enum(
    ["TECHNICAL", "ORDER", "COOPERATION", "COMPLAINT", "OTHER"],
    {
      errorMap: () => ({ message: "Выберите корректную причину обращения" }),
    },
  ),
  description: z
    .string()
    .min(10, "Описание должно быть подробнее (минимум 10 символов)")
    .max(3000, "Не более 3000 символов для текста"),
  //@ts-ignore:
  captchaToken: z.string({ required_error: "Ошибка безопасности" }),
  // captchaToken: z.string().min(1, "Токен безопасности обязателен"),
});

////-----------------------------------------------------------------------------------------------////
////--------------------------2) Модуль Catalog-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------2.1) Схема для получения брендов:--------------------------------------------//
export const GetBrandsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    //Благодаря default автоматически подставится значение 1, если page не указан в адресной строке

    limit: z.coerce.number().int().positive().max(100).default(24),

    search: z.string().optional(),
    //Тип для search: string | undefined (т.к. optional)
  }),
});

type BrandsPageInput = z.infer<typeof GetBrandsQuerySchema>;
//Чистый тип для сервиса:
export type GetBrandsArgs = BrandsPageInput["query"];

//----------------------------2.2) Схема для получения мотоциклов бренда:--------------------------------------------//
const MotoCategoryEnum = z.enum([
  "Allround",
  "ATV",
  "Classic",
  "Cross / motocross",
  "Custom / cruiser",
  "Enduro / offroad",
  "Minibike, cross",
  "Minibike, sport",
  "Naked bike",
  "Prototype / concept model",
  "Scooter",
  "Speedway",
  "Sport",
  "Sport touring",
  "Super motard",
  "Touring",
  "Trial",
  "Unspecified category",
]);
const TransmissionTypeEnum = z.enum(["Chain", "Belt", "Cardan"]);

export const GetMotorcyclesQuerySchema = z.object({
  query: z
    .object({
      brandSlug: z
        .string()
        .toLowerCase()
        .min(1, "brandSlug является обязательным параметром"),
      minPrice: z.coerce.number().int().positive().optional(),
      maxPrice: z.coerce.number().int().positive().optional(),
      minYear: z.coerce.number().int().min(1894).max(2026).optional(),
      maxYear: z.coerce.number().int().min(1894).max(2026).optional(),
      minDisplacement: z.coerce.number().int().positive().optional(),
      maxDisplacement: z.coerce.number().int().positive().optional(),
      minPower: z.coerce.number().positive().optional(),
      maxPower: z.coerce.number().positive().optional(),
      category: MotoCategoryEnum.optional(),
      transmission: TransmissionTypeEnum.optional(),
      // onlyInStock: z.boolean().default(false),
      onlyInStock: z.string().default("false"),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(20),
      search: z.string().optional(),
      sortBy: z
        .enum([
          "price_asc",
          "price_desc",
          "year_desc",
          "rating_desc",
          "name_asc",
          "name_desc",
        ])
        .optional(),
    })
    .strict(), // Запрещаем любые другие параметры
});

export type MotorcyclesQueryInput = z.infer<typeof GetMotorcyclesQuerySchema>;
export type MotorcyclesServiceArgs = MotorcyclesQueryInput["query"];

//----------------------------2.3) Схема для получения конкретного мотоцикла:--------------------------------------------//
export const GetMotoBySlugSchema = z.object({
  params: z.object({
    brandSlug: z.string().min(1, "Бренд обязателен"),
    slug: z.string().min(1, "Слаг обязателен"),
  }),
});
export type MotoBySlugInput = z.infer<typeof GetMotoBySlugSchema>;
export type MotoBySlugServiceArgs = MotoBySlugInput["params"];

//----------------------------2.4) Схема для получения рекоммендаций:--------------------------------------------//
export const GetRelatedBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Слаг обязателен"),
  }),
});
export type RelatedBySlugInput = z.infer<typeof GetRelatedBySlugSchema>;
export type RelatedBySlugServiceArgs = RelatedBySlugInput["params"];

//----------------------------2.5) Схема для подсказок к глобальному поиску:-------------------------------------//
export const GetSuggestionsQuerySchema = z.object({
  query: z.object({
    q: z.string().min(2).toLowerCase(),
  }),
});

type SuggestionsInput = z.infer<typeof GetSuggestionsQuerySchema>;
//Чистый тип для сервиса:
export type GetSuggestionsArgs = SuggestionsInput["query"];

////-----------------------------------------------------------------------------------------------////
////--------------------------3) Модуль Admin-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------3.1) Схема для получения мотоциклов:-------------------------------------//
export const GetMotosAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    //Благодаря default автоматически подставится значение 1, если page не указан в адресной строке

    limit: z.coerce.number().int().positive().max(100).default(10),

    search: z.string(),
    //Тип для search: string | undefined (т.к. optional)
  }),
});

type MotosAdminInput = z.infer<typeof GetMotosAdminSchema>;
//Чистый тип для сервиса:
export type MotosAdminArgs = MotosAdminInput["query"];

//----------------------------3.2) Схема для создания мотоцикла:-------------------------------------//
export const createMotorcycleAdminSchema = z.object({
  body: z.object({
    model: z
      .string()
      .trim()
      .min(2, { message: "Имя слишком короткое" })
      .max(30, "Максимум 30 символов для модели")
      .regex(
        /^[a-zA-Zа-яА-ЯёЁ0-9]+$/,
        "Для модели используйте только цифры, английские и русские буквы",
      ),
    colors: z.array(
      z
        .string()
        .min(3, { message: "Название цвета слишком короткое" })
        .max(20, "Максимум 20 символов для цвета"),
    ),
    year: z.string().regex(/^\d{4}$/, "Неверный формат года"),
    brandId: z.string(),
    category: z.enum(
      [
        "ATV",
        "ALLROUND",
        "CLASSIC",
        "CROSS_MOTOCROSS",
        "CUSTOM_CRUISER",
        "ENDURO_OFFROAD",
        "MINIBIKE_CROSS",
        "MINIBIKE_SPORT",
        "NAKED_BIKE",
        "PROTOTYPE_CONCEPT",
        "SCOOTER",
        "SPEEDWAY",
        "SPORT",
        "SPORT_TOURING",
        "SUPER_MOTARD",
        "TOURING",
        "TRIAL",
        "UNSPECIFIED",
      ],
      {
        message: "Выберите корректную категорию мотоцикла",
      },
    ),
    price: z.string().regex(/^\d+$/, "Цена должна быть числовой строкой"),
    displacement: z
      .string()
      .regex(/^\d+$/, "Объем должен быть числовой строкой"),
    power: z.string(),
    coolingSystem: z.enum(["AIR", "LIQUID", "OIL_AIR"]),
    gearbox: z.enum([
      "SPEED1",
      "SPEED2",
      "SPEED2AUTOMATIC",
      "SPEED3",
      "SPEED3AUTOMATIC",
      "SPEED4",
      "SPEED4WITHREVERSE",
      "SPEED5",
      "SPEED5WITHREVERSE",
      "SPEED6",
      "SPEED6WITHREVERSE",
      "SPEED7",
      "SPEED8",
      "AUTOMATIC",
    ]),
    transmission: z.enum(["CHAIN", "BELT", "CARDAN"]),
    starter: z.enum(["ELECTRIC", "KICK", "ELECTRIC_KICK"]),
    comments: z.string(),
    siteCategory: z.enum(["Мотоциклы", "Мотоэкипировка", "Запчасти"], {
      message: "Выберите корректную категорию товара",
    }),
  }),
});

type createMotorcycleAdminInput = z.infer<typeof createMotorcycleAdminSchema>;
//Чистый тип для сервиса:
export type createMotorcycleAdminArgs = createMotorcycleAdminInput["body"];
//----------------------------3.3) Схема для обновления мотоцикла:-------------------------------------//

//----------------------------3.4) Схема для удаления мотоцикла:-------------------------------------//
export const DeleteMotoAdminSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id обязателен"),
  }),
});
export type DeleteMotoAdminInput = z.infer<typeof DeleteMotoAdminSchema>;
export type DeleteMotoAdminArgs = DeleteMotoAdminInput["params"];
