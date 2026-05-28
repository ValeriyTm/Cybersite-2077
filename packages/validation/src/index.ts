import { z } from "zod";

////-----------------------------------------------------------------------------------------------////
////--------------------------1) Модуль Auth-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------1.1) Схема для регистрации:--------------------------------------------//
export const RegisterSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .regex(
          /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, //Моя оптимальная регулярка для email:
          "Введите корректный адрес электронной почты",
        ),
      password: z
        .string()
        .trim()
        .min(8, "Пароль должен иметь минимум 8 символов")
        .max(32, "Пароль должен иметь максимум 32 символа")
        .regex(/[A-Z]/, "В пароле нужна хотя бы одна заглавная буква")
        .regex(/[a-z]/, "В пароле нужна хотя бы одна строчная буква")
        .regex(/[0-9]/, "В пароле нужна хотя бы одна цифра")
        .regex(
          /[^a-zA-Z0-9]/,
          "В пароле нужен хотя бы один спецсимвол (@, #, $ и т.д.)",
        ),
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
      captchaToken: z.string().min(1, { message: "captcha не валидна" }),
    })
    .strict(),
});

type RegisterInput = z.infer<typeof RegisterSchema>;
//Чистый тип для сервиса:
export type RegisterArgs = RegisterInput["body"];

//-------------------------------------------------
//Плоская (без body) схема-заготовка для фронтенда:
export const RegisterFrontendSchema = RegisterSchema.shape.body;
//Схема для фронтенда:
export const RegisterFormSchema = RegisterFrontendSchema.extend({
  confirmPassword: z.string().min(1, "Подтвердите пароль"),
  acceptTerms: z.literal(true, {
    message: "Нужно ваше согласие на обработку данных",
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

//Создаём тип для регистрации на основе схемы (для frontend):
export type RegisterFormType = z.infer<typeof RegisterFormSchema>;

//----------------------------1.2) Схема для логина:--------------------------------------------//
export const LoginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.email({ message: "Некорректный email или пароль" })),
      password: z
        .string()
        .min(8, { message: "Некорректный email или пароль" })
        .max(32, { message: "Некорректный email или пароль" }),
      rememberMe: z.boolean(),
      captchaToken: z.string().min(1, { message: "captcha не валидна" }),
    })
    .strict(),
});

type LoginInput = z.infer<typeof LoginSchema>;
//Чистый тип для сервиса:
export type LoginArgs = LoginInput["body"];

//--------------------
//Плоская (без body) схема для фронтенда:
export const LoginFrontendSchema = LoginSchema.shape.body;
//Чистый тип для фронтенда:
export type LoginFormType = z.output<typeof LoginFrontendSchema>; //Использую output, т.к. с infer получили бы для rememberMe тип boolean | undefined из-за default()

//----------------------------1.3) Схема для активации аккаунта:--------------------------------------------//
export const ActivationSchema = z.object({
  params: z.object({
    token: z.uuid({ message: "Неверный формат токена" }),
  }),
});
export type ActivationInput = z.infer<typeof ActivationSchema>;
export type ActivationParamArgs = ActivationInput["params"];

//----------------------------1.4) Схема для смены пароля в профиле:--------------------------------------------//
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

//Тип:
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;

// Схема для бэкенда:
export const BackendChangePasswordSchema = z.object({
  body: ChangePasswordSchema,
});

//----------------------------1.5) Схема для удаления аккаунта из профиля:--------------------------------------------//
export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Введите пароль для подтверждения"),
});

//Тип:
export type DeleteAccountType = z.infer<typeof DeleteAccountSchema>;

// Схема для бэкенда:
export const BackendDeleteAccountSchema = z.object({
  body: DeleteAccountSchema,
});

//----------------------------1.6) Схема для ввода email (Forgot Password):--------------------------------------------//
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    //Моя оптимальная регулярка для email:
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      "Введите корректный адрес электронной почты",
    ),
  captchaToken: z.string().min(1, { message: "captcha не валидна" }),
});

//Тип:
export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;

// Схема для бэкенда:
export const BackendForgotPasswordSchema = z.object({
  body: ForgotPasswordSchema,
});

//----------------------------1.7) Схема для замены пароля (Reset Password):--------------------------------------------//
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
    captchaToken: z.string({ message: "Ошибка безопасности" }),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;

// Схема для бэкенда:
export const BackendResetPasswordSchema = z.object({
  body: ResetPasswordSchema,
  query: z.object({
    token: z.string().min(1).max(64),
  }),
});

export type ResetPasswordQueryType = z.infer<
  typeof BackendResetPasswordSchema
>["query"];

//----------------------------1.8) Схема для получения ответа от Google (OIDC):--------------------------------------------//
export const GoogleResponseSchema = z.object({
  query: z.object({
    code: z.string().min(1),
  }),
});

export type GoogleResponseArgs = z.infer<typeof GoogleResponseSchema>["query"];

//----------------------------1.9) Схема для включения 2FA:--------------------------------------------//
export const activate2FASchema = z.object({
  body: z.object({
    code: z
      .string()
      .length(6, "Код должен содержать 6 цифр")
      .regex(/^\d+$/, "Код должен состоять только из цифр"),
  }),
});

export type activate2FAArgs = z.infer<typeof activate2FASchema>["body"];

//----------------------------1.10) Схема для входа с 2FA:--------------------------------------------//
// Базовые поля для повторного использования
const baseFields = {
  userId: z.uuid({ message: "Неверный формат id" }),
  code: z
    .string()
    .trim()
    .length(6, "Код должен содержать 6 цифр")
    .regex(/^\d+$/, "Код должен состоять только из цифр"),
};

// Схема для бэкенда:
export const BackendVerify2FASchema = z.object({
  body: z.object(baseFields), //Берем все поля из baseFields
});

// Схема для фронтенда:
export const Verify2FASchema = z.object(baseFields).pick({ code: true }); //Берем только поле code

//Тип для фронтенда:
export type Verify2FAType = z.infer<typeof Verify2FASchema>;
//Тип для бэкенда:
export type Verify2FAArgs = z.infer<typeof BackendVerify2FASchema>["body"];

//----------------------------1.11) Схема для обновления профиля:--------------------------------------------//
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Имя слишком короткое" })
    .max(20, "Максимум 20 символов для имени")
    .regex(
      /^[a-z0-9_]+$/,
      "Для имени используйте только латиницу, цифры и нижнее подчеркивание",
    ),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
      "Введите корректный номер телефона",
    ) //Телефон: Необязательный "+"" в начале. Первая цифра от 1 до 9. Всего от 2 до 15 цифр (международный стандарт E.164):
    .nullable(),
  birthday: z.coerce
    .date({
      message: "Введите корректную дату",
    })
    .max(new Date(), "Дата не может быть в будущем")
    .nullable(),
  gender: z.enum(["MALE", "FEMALE"]).nullable(),
});

// Схема для бэкенда:
export const BackendUpdateProfileSchema = z.object({
  body: UpdateProfileSchema,
});

export type UpdateProfileType = z.infer<typeof UpdateProfileSchema>;
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

//----------------------------2.3) Схема для получения конкретного мотоцикла по slug:--------------------------------------------//
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

//----------------------------2.6) Схема для получения конкретного мотоцикла по id:--------------------------------------------//
export const GetMotoByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "id мотоцикла обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type MotoByIdInput = z.infer<typeof GetMotoByIdSchema>;
export type MotoByIdServiceArgs = MotoByIdInput["params"];

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
    power: z
      .string()
      .regex(
        /^\d+(\.\d+)?$/,
        "Мощность должна быть числом (например, 8 или 8.5)",
      ),
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
export const updateMotorcycleAdminSchema = z.object({
  body: z.object({
    id: z.string(),
    model: z
      .string()
      .trim()
      .min(2, { message: "Имя слишком короткое" })
      .max(30, "Максимум 30 символов для модели")
      .regex(
        /^[a-zA-Zа-яА-ЯёЁ0-9 ]+$/,
        "Для модели используйте только цифры, английские и русские буквы",
      ),
    slug: z.string(),
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
    year: z.coerce
      .number()
      .min(1850)
      .max(2077)
      .default(() => new Date().getFullYear()),
    displacement: z.coerce.number().default(0),
    power: z.preprocess(
      (val) => (val === "null" || val === "" || val === "NaN" ? null : val),
      z.coerce.number().nullable(),
    ),
    engineType: z.string(),
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
    colors: z.preprocess((val) => {
      if (!val) return [];
      if (typeof val === "string") return [val];
      return val;
    }, z.array(z.string())),
    starter: z.enum(["ELECTRIC", "KICK", "ELECTRIC_KICK"]),
    comments: z.string(),
    price: z.coerce
      .number({ message: "Цена должна быть числом" })
      .default(300000),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    brand: z.any(),
    images: z.any(),
    siteCategory: z.enum(["Мотоциклы", "Мотоэкипировка", "Запчасти"], {
      message: "Выберите корректную категорию товара",
    }),
    deletedImageIds: z
      .array(z.string().min(1, { message: "id не должен быть пустым" }))
      .optional(),
    mainImageId: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "id обязателен"),
  }),
});

export type updateMotoAdminInput = z.infer<typeof updateMotorcycleAdminSchema>;
export type updateMotoAdminBodyArgs = updateMotoAdminInput["body"];
export type updateMotoAdminParamsArgs = updateMotoAdminInput["params"];
//----------------------------3.4) Схема для удаления мотоцикла:-------------------------------------//
export const DeleteMotoAdminSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id обязателен"),
  }),
});
export type DeleteMotoAdminInput = z.infer<typeof DeleteMotoAdminSchema>;
export type DeleteMotoAdminArgs = DeleteMotoAdminInput["params"];

//----------------------------3.5) Схема для поиска бренда:-------------------------------------//
export const SearchBrandsAdminSchema = z.object({
  query: z.object({
    query: z.string(),
  }),
});

export type SearchBrandsAdminInput = z.infer<typeof SearchBrandsAdminSchema>;
export type SearchBrandsAdminArgs = SearchBrandsAdminInput["query"];

//----------------------------3.6) Схема для получения брендов:-------------------------------------//
export const GetBrandsAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    //Благодаря default автоматически подставится значение 1, если page не указан в адресной строке

    limit: z.coerce.number().int().positive().max(100).default(10),

    search: z.string().optional(),
    //Тип для search: string | undefined (т.к. optional)
  }),
});

type BrandsAdminInput = z.infer<typeof GetBrandsAdminSchema>;
//Чистый тип для сервиса:
export type BrandsAdminArgs = BrandsAdminInput["query"];

//----------------------------3.7) Схема для создания бренда:-------------------------------------//
export const CreateBrandAdminSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Имя слишком короткое" })
      .max(20, "Максимум 20 символов для имени")
      .regex(
        /^[a-zA-Zа-яА-ЯёЁ0-9 ]+$/,
        "Для модели используйте только цифры, английские и русские буквы",
      ),
    country: z
      .string()
      .trim()
      .min(2, { message: "Название страны слишком короткое" })
      .max(30, "Максимум 30 символов для страны")
      .regex(
        /^[а-яА-ЯёЁ ]+$/,
        "Для названия страны используйте только русские буквы",
      ),
    slug: z
      .string()
      .trim()
      .min(2, { message: "Slug слишком короткий" })
      .max(30, "Максимум 30 символов для slug")
      .regex(/^[a-zA-Zа ]+$/, "Для slug используйте только английскиебуквы"),
  }),
});

export type CreateBrandAdminInput = z.infer<typeof CreateBrandAdminSchema>;
export type CreateBrandAdminArgs = CreateBrandAdminInput["body"];

//Схема для фронтенда:
export const CreateBrandAdminFrontendSchema = CreateBrandAdminSchema.shape.body;
//----------------------------3.8) Схема для обновления бренда:-------------------------------------//
export const UpdateBrandAdminSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Имя слишком короткое" })
      .max(20, "Максимум 20 символов для имени")
      .regex(
        /^[a-zA-Zа-яА-ЯёЁ0-9 ]+$/,
        "Для модели используйте только цифры, английские и русские буквы",
      ),
    country: z
      .string()
      .trim()
      .min(2, { message: "Название страны слишком короткое" })
      .max(30, "Максимум 30 символов для страны")
      .regex(
        /^[а-яА-ЯёЁ ]+$/,
        "Для названия страны используйте только русские буквы",
      ),
    slug: z
      .string()
      .trim()
      .min(2, { message: "Slug слишком короткий" })
      .max(30, "Максимум 30 символов для slug")
      .regex(/^[a-zA-Zа ]+$/, "Для slug используйте только английскиебуквы"),
  }),
  params: z.object({
    id: z.string().min(1, "id обязателен"),
  }),
});
export type UpdateBrandAdminInput = z.infer<typeof UpdateBrandAdminSchema>;
export type UpdateBrandAdminBodyArgs = UpdateBrandAdminInput["body"];
export type UpdateBrandAdminParamArgs = UpdateBrandAdminInput["params"];

//----------------------------3.9) Схема для удаления бренда:-------------------------------------//
export const DeleteBrandAdminSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id обязателен"),
  }),
});
export type DeleteBrandAdminInput = z.infer<typeof DeleteBrandAdminSchema>;
export type DeleteBrandAdminParamArgs = DeleteBrandAdminInput["params"];

//----------------------------3.10) Схема для получения остатков:-------------------------------------//
export const GetStocksAdminSchema = z.object({
  query: z.object({
    motoId: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
  }),
});

type StocksAdminInput = z.infer<typeof GetStocksAdminSchema>;
//Чистый тип для сервиса:
export type StocksAdminArgs = StocksAdminInput["query"];

//----------------------------3.11) Схема для обновления остатков:-------------------------------------//
export const UpdateStocksAdminSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
  }),
  body: z.object({
    quantity: z.coerce.number().int().nonnegative(),
  }),
});

type StocksUpdateAdminInput = z.infer<typeof UpdateStocksAdminSchema>;
//Чистый тип для сервиса:
export type StocksUpdateAdminParamsArgs = StocksUpdateAdminInput["params"];
export type StocksUpdateAdminBodyArgs = StocksUpdateAdminInput["body"];

//----------------------------3.12) Схема для получения персональных скидок:-------------------------------------//
export const GetPersonalDiscountsSchema = z.object({
  query: z.object({
    email: z.string().trim().toLowerCase(),
  }),
});

type GetPersonalDiscountsInput = z.infer<typeof GetPersonalDiscountsSchema>;
//Чистый тип для сервиса:
export type GetPersonalDiscountsArgs = GetPersonalDiscountsInput["query"];

//----------------------------3.13) Схема для получения заказов:-------------------------------------//
export const GetOrdersAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z
      .enum([
        "PENDING",
        "PAID",
        "CANCELED",
        "DELIVERY",
        "DELIVERED",
        "COMPLETED",
        "",
      ])
      .optional(),
    email: z.string().optional(),
  }),
});

type GetOrdersAdminInput = z.infer<typeof GetOrdersAdminSchema>;
//Чистый тип для сервиса:
export type GetOrdersAdminArgs = GetOrdersAdminInput["query"];

//----------------------------3.14) Схема для изменения статуса заказа:-------------------------------------//
export const ChangeOrderStatusAdminSchema = z.object({
  body: z.object({
    status: z.enum([
      "PENDING",
      "PAID",
      "CANCELED",
      "DELIVERY",
      "DELIVERED",
      "COMPLETED",
    ]),
  }),
  params: z.object({
    id: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
  }),
});

type ChangeOrderStatusAdminInput = z.infer<typeof ChangeOrderStatusAdminSchema>;
//Чистый тип для сервиса:
export type ChangeOrderStatusAdminBodyArgs =
  ChangeOrderStatusAdminInput["body"];
export type ChangeOrderStatusAdminParamsArgs =
  ChangeOrderStatusAdminInput["params"];

//----------------------------3.15) Схема для получения отчетов:-------------------------------------//
export const GetReportsAdminSchema = z.object({
  query: z.object({
    format: z.enum(["xlsx", "pdf"]),
    days: z.coerce
      .number()
      .int()
      .nonnegative()
      .min(1, { message: "Минимум 1 день" })
      .default(30),
  }),
});

type GetReportsAdminInput = z.infer<typeof GetReportsAdminSchema>;
//Чистый тип для сервиса:
export type GetReportsAdminArgs = GetReportsAdminInput["query"];

//----------------------------13.16) Схема для получения всех тикетов:-------------------------------------//
export const GetTicketsAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.preprocess(
      //Если с фронтенда придет пустая строка, то превратим её в undefined:
      (val) => (val === "" ? undefined : val),
      z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
    ),
    email: z.string().optional(),
  }),
});

type GetTicketsAdminInput = z.infer<typeof GetTicketsAdminSchema>;
//Чистый тип для сервиса:
export type GetTicketsAdminArgs = GetTicketsAdminInput["query"];

//----------------------------13.17) Схема для создания ответа на тикет:-------------------------------------//
export const ReplyOnTicketAdminSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
  }),
  body: z.object({
    answer: z.string().min(1).max(2000),
  }),
});

type ReplyOnTicketAdminInput = z.infer<typeof ReplyOnTicketAdminSchema>;
//Чистый тип для сервиса:
export type ReplyOnTicketAdminParamsArgs = ReplyOnTicketAdminInput["params"];
export type ReplyOnTicketAdminBodyArgs = ReplyOnTicketAdminInput["body"];

//----------------------------13.18) Схема для изменения статуса тикета:-------------------------------------//
export const ChangeStatusOfTicketAdminSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
  }),
  body: z.object({
    status: z.preprocess(
      //Если с фронтенда придет пустая строка, то превратим её в undefined:
      (val) => (val === "" ? undefined : val),
      z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    ),
  }),
});

type ChangeStatusOfTicketAdminInput = z.infer<
  typeof ChangeStatusOfTicketAdminSchema
>;
//Чистый тип для сервиса:
export type ChangeStatusOfTicketAdminParamsArgs =
  ChangeStatusOfTicketAdminInput["params"];
export type ChangeStatusOfTicketAdminBodyArgs =
  ChangeStatusOfTicketAdminInput["body"];

//----------------------------13.19) Схема для создания новости:-------------------------------------//
export const CreateNewsSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(50), //Заголовок новости
    excerpt: z.string().min(1).max(100), //Краткое превью
    content: z.any(),
    status: z.preprocess(
      //Если с фронтенда придет пустая строка, то превратим её в undefined:
      (val) => (val === "" ? undefined : val),
      z.enum(["DRAFT"]),
    ),
    tags: z
      .array(
        z
          .string()
          .min(1, { message: "tag не должен быть пустой строкой" })
          .max(36, "Максимум 36 символов для tag"),
      )
      .optional(),
  }),
});

type CreateNewsInput = z.infer<typeof CreateNewsSchema>;
//Чистый тип для сервиса:
export type CreateNewsArgs = CreateNewsInput["body"];

//----------------------------13.20) Схема для обновления новости:-------------------------------------//
export const UpdateNewsSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(50), //Заголовок новости
    excerpt: z.string().min(1).max(100), //Краткое превью
    content: z.any(),
    status: z.preprocess(
      //Если с фронтенда придет пустая строка, то превратим её в undefined:
      (val) => (val === "" ? undefined : val),
      z.enum(["DRAFT"]),
    ),
    tags: z
      .array(
        z
          .string()
          .min(1, { message: "tag не должен быть пустой строкой" })
          .max(36, "Максимум 36 символов для tag"),
      )
      .optional(),
  }),
  params: z.object({
    id: z
      .string()
      .min(1, "id новости обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});

type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;
//Чистый тип для сервиса:
export type UpdateNewsBodyArgs = UpdateNewsInput["body"];
export type UpdateNewsParamsArgs = UpdateNewsInput["params"];

//----------------------------13.21) Схема для удаления новости:-------------------------------------//
export const DeleteNewsSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "id новости обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});

type DeleteNewsInput = z.infer<typeof DeleteNewsSchema>;
//Чистый тип для сервиса:
export type DeleteNewsArgs = DeleteNewsInput["params"];

//----------------------------13.22) Схема для обновления статуса новости:-------------------------------------//
export const UpdateStatusNewsSchema = z.object({
  body: z.object({
    status: z.preprocess(
      //Если с фронтенда придет пустая строка, то превратим её в undefined:
      (val) => (val === "" ? undefined : val),
      z.enum(["DRAFT", "PUBLISHED"]),
    ),
  }),
  params: z.object({
    id: z
      .string()
      .min(1, "id новости обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});

type UpdateStatusNewsInput = z.infer<typeof UpdateStatusNewsSchema>;
//Чистый тип для сервиса:
export type UpdateStatusNewsBodyArgs = UpdateStatusNewsInput["body"];
export type UpdateStatusNewsParamsArgs = UpdateStatusNewsInput["params"];

//----------------------------3.23) Схема для получения юзеров:-------------------------------------//
export const GetUsersAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    role: z
      .preprocess(
        (val) => (val === "" ? null : val),
        z
          .enum(["USER", "MANAGER", "CONTENT_EDITOR", "ADMIN", "SUPERADMIN"])
          .nullable(),
      )
      .default(null),
    email: z.string().optional(),
  }),
});

type GetUsersAdminInput = z.infer<typeof GetUsersAdminSchema>;
//Чистый тип для сервиса:
export type GetUsersAdminArgs = GetUsersAdminInput["query"];

//----------------------------3.24) Схема для изменения роли юзеру:-------------------------------------//
export const UpdateUserStatusAdminSchema = z.object({
  body: z.object({
    role: z.enum(["USER", "MANAGER", "CONTENT_EDITOR", "ADMIN", "SUPERADMIN"]),
  }),
  params: z.object({
    id: z.uuid({ message: "Неверный формат id" }),
  }),
});

type UpdateUserStatusAdminInput = z.infer<typeof UpdateUserStatusAdminSchema>;
//Чистый тип для сервиса:
export type UpdateUserStatusAdminBodyArgs = UpdateUserStatusAdminInput["body"];
export type UpdateUserStatusAdminParamsArgs =
  UpdateUserStatusAdminInput["params"];

//----------------------------3.25) Схема для удаления юзера:-------------------------------------//
export const DeleteUserAdminSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Неверный формат id" }),
  }),
});

type DeleteUserAdminInput = z.infer<typeof DeleteUserAdminSchema>;
//Чистый тип для сервиса:
export type DeleteUserAdminArgs = DeleteUserAdminInput["params"];

////-----------------------------------------------------------------------------------------------////
////--------------------------4) Модуль Traparamsing-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------4.1) Схема для добавления в избранное:-------------------------------------//
export const ToggleFavSchema = z.object({
  params: z.object({
    motorcycleId: z
      .string()
      .min(1, "id мотоцикла обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type ToggleFavInput = z.infer<typeof ToggleFavSchema>;
export type ToggleFavServiceArgs = ToggleFavInput["params"];

//----------------------------4.2) Схема для получения данных о избранном по списку id:-------------------------------------//
export const GetFavsByIdsSchema = z.object({
  body: z.object({
    ids: z.array(
      z
        .string()
        .min(1, { message: "id не должен быть пустой строкой" })
        .max(36, "Максимум 36 символов для id"),
    ),
    limit: z.coerce.number().int().positive().max(100).default(10),

    skip: z.coerce.number().int().nonnegative().default(0),
  }),
});

type GetFavsByIdsInput = z.infer<typeof GetFavsByIdsSchema>;
//Чистый тип для сервиса:
export type GetFavsByIdsArgs = GetFavsByIdsInput["body"];

//----------------------------4.3) Схема для добавления в корзину:-------------------------------------//
export const AddToCartSchema = z.object({
  body: z.object({
    motorcycleId: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
    quantity: z.coerce.number().int().positive(),
    model: z.string().min(1),
    price: z.coerce.number().nonnegative().default(300000),
    image: z.string().catch(""),
    slug: z.string().min(1).max(50),
    year: z.coerce.number().int().min(1850).max(new Date().getFullYear()),
  }),
});

type AddToCartInput = z.infer<typeof AddToCartSchema>;
//Чистый тип для сервиса:
export type AddToCartArgs = AddToCartInput["body"];

//----------------------------4.4) Схема для обновления кол-ва в корзине:-------------------------------------//
export const UpdateQuantityCartSchema = z.object({
  body: z.object({
    motorcycleId: z
      .string()
      .min(1, { message: "id не должен быть пустой строкой" })
      .max(36, "Максимум 36 символов для id"),
    quantity: z.coerce.number().int().nonnegative(),
  }),
});

type UpdateQuantityCartInput = z.infer<typeof UpdateQuantityCartSchema>;
//Чистый тип для сервиса:
export type UpdateQuantityCartArgs = UpdateQuantityCartInput["body"];

//----------------------------4.5) Схема для удаления одного товара из корзины:-------------------------------------//
export const DeleteSingleFromCartSchema = z.object({
  params: z.object({
    motorcycleId: z
      .string()
      .min(1, "id мотоцикла обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type DeleteSingleFromCartInput = z.infer<
  typeof DeleteSingleFromCartSchema
>;
export type DeleteSingleFromCartServiceArgs =
  DeleteSingleFromCartInput["params"];

//----------------------------4.6) Схема для удаления нескольких товаров из корзины:-------------------------------------//
export const DeleteMultipleFromCartSchema = z.object({
  body: z.object({
    ids: z.array(
      z
        .string()
        .min(1, { message: "id не должен быть пустой строкой" })
        .max(36, "Максимум 36 символов для id"),
    ),
  }),
});

type DeleteMultipleFromCartInput = z.infer<typeof DeleteMultipleFromCartSchema>;
//Чистый тип для сервиса:
export type DeleteMultipleFromCartArgs = DeleteMultipleFromCartInput["body"];

//----------------------------4.7) Схема для переключения товара в корзине:-------------------------------------//
export const ToggleSingleCartSchema = z.object({
  body: z.object({
    motorcycleId: z
      .string()
      .min(1, "id мотоцикла обязателен")
      .max(36, "Максимум 36 символов для id"),
    selected: z.boolean(),
  }),
});
export type ToggleSingleCartInput = z.infer<typeof ToggleSingleCartSchema>;
export type ToggleSingleCartServiceArgs = ToggleSingleCartInput["body"];

//----------------------------4.87) Схема для переключения всех товаров в корзине:-------------------------------------//
export const ToggleAllCartSchema = z.object({
  body: z.object({
    isSelected: z.boolean(),
  }),
});
export type ToggleAllCartInput = z.infer<typeof ToggleAllCartSchema>;
export type ToggleAllCartServiceArgs = ToggleAllCartInput["body"];

////-----------------------------------------------------------------------------------------------////
////--------------------------5) Модуль Discount-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------5.1) Схема для применения промокода:-------------------------------------//
export const ApplyPromoSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, "code промокода обязателен")
      .max(30, "Максимум 30 символов для промокода"),
  }),
});
export type ApplyPromoInput = z.infer<typeof ApplyPromoSchema>;
export type ApplyPromoServiceArgs = ApplyPromoInput["body"];

////-----------------------------------------------------------------------------------------------////
////--------------------------6) Модуль Warehouse-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------6.1) Схема для расчёта доставки:-------------------------------------//
export const DeliveryCalculateSchema = z.object({
  body: z.object({
    lat: z.coerce.number().min(-90).max(90), // Широта: от -90 до 90 градусов
    lng: z.coerce.number().min(-180).max(180), // Долгота: от -180 до 180 градусов
    items: z.array(
      z.object({
        id: z
          .string()
          .min(1, { message: "id не должен быть пустой строкой" })
          .max(36, "Максимум 36 символов для id"),
        quantity: z.number().int().positive(),
      }),
    ),
  }),
});
export type DeliveryCalculateInput = z.infer<typeof DeliveryCalculateSchema>;
export type DeliveryCalculateServiceArgs = DeliveryCalculateInput["body"];

////-----------------------------------------------------------------------------------------------////
////--------------------------7) Модуль Ordering-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------7.1) Схема для создания заказа:-------------------------------------//
export const CreateOrderSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z
          .string()
          .min(1, "id мотоцикла обязателен")
          .max(36, "Максимум 36 символов для id"),
        model: z.string().min(1).max(70),
        price: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
      }),
    ),
    address: z.string().min(1).max(300),
    coords: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    deliveryInfo: z.object({
      warehouse: z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(50),
        city: z.string().min(1).max(20),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        distanceKm: z.number().nonnegative(),
      }),
      cost: z.number().int().nonnegative(),
      days: z.number().int().positive(),
      estimatedDate: z.string(),
      distanceKm: z.number().int().nonnegative(),
    }),
    promoCode: z.string().min(2).max(20).nullable(),
    totalPrice: z.number().int().nonnegative(),
    shouldPay: z.boolean(),
  }),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateOrderServiceArgs = CreateOrderInput["body"];

//----------------------------7.2) Схема для получения заказов:-------------------------------------//
export const GetOrdersSchema = z.object({
  query: z.object({
    status: z
      .enum([
        "PENDING",
        "PAID",
        "CANCELED",
        "DELIVERY",
        "DELIVERED",
        "COMPLETED",
      ])
      .optional(),
  }),
});

type GetOrdersInput = z.infer<typeof GetOrdersSchema>;
//Чистый тип для сервиса:
export type GetOrdersArgs = GetOrdersInput["query"];

//----------------------------7.3) Схема для подтверждения заказа:-------------------------------------//
export const ConfirmOrderSchema = z.object({
  params: z.object({
    orderId: z
      .string()
      .min(1, "id заказа обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type ConfirmOrderInput = z.infer<typeof ConfirmOrderSchema>;
export type ConfirmOrderParamArgs = ConfirmOrderInput["params"];

//----------------------------7.4) Схема для отмены заказа:-------------------------------------//
export const CancelOrderSchema = z.object({
  params: z.object({
    orderId: z
      .string()
      .min(1, "id заказа обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type CancelOrderParamArgs = CancelOrderInput["params"];

////-----------------------------------------------------------------------------------------------////
////--------------------------8) Модуль Review-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------8.1) Схема для создания отзыва:-------------------------------------//
export const CreateReviewSchema = z.object({
  body: z.object({
    orderId: z
      .string()
      .min(1, "id заказа обязателен")
      .max(36, "Максимум 36 символов для id"),
    motorcycleId: z
      .string()
      .min(1, "id мотоцикла обязателен")
      .max(36, "Максимум 36 символов для id"),
    rating: z.coerce.number().int().min(1).max(5).default(5),
    comment: z.string().min(5).max(2000),
  }),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type CreateReviewServiceArgs = CreateReviewInput["body"];

//----------------------------8.2) Схема для получения отзывов на товар:-------------------------------------//
export const GetReviewSchema = z.object({
  params: z.object({
    motorcycleId: z
      .string()
      .min(1, "id мотоцикла обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type GetReviewInput = z.infer<typeof GetReviewSchema>;
export type GetReviewServiceArgs = GetReviewInput["params"];

//----------------------------8.3) Схема для удаления отзыва:-------------------------------------//
export const DeleteReviewSchema = z.object({
  params: z.object({
    reviewId: z
      .string()
      .min(1, "id заказа обязателен")
      .max(36, "Максимум 36 символов для id"),
  }),
});
export type DeleteReviewInput = z.infer<typeof DeleteReviewSchema>;
export type DeleteReviewServiceArgs = DeleteReviewInput["params"];

////-----------------------------------------------------------------------------------------------////
////--------------------------9) Модуль Support-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------9.1) Схема для создания тикета:-------------------------------------//
export const createTicketSchema = z.object({
  body: z.object({
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
    category: z.enum(
      ["TECHNICAL", "ORDER", "COOPERATION", "COMPLAINT", "OTHER"],
      { message: "Выберите корректную причину обращения" },
    ),
    description: z
      .string()
      .min(10, "Описание должно быть подробнее (минимум 10 символов)")
      .max(3000, "Не более 3000 символов для текста"),
    captchaToken: z.string().min(1, "Токен безопасности обязателен"),
  }),
});

export type createTicketInput = z.infer<typeof createTicketSchema>;
export type createTicketServiceArgs = createTicketInput["body"];

//Плоская (без body) схема для фронтенда:
export const createTicketFrontendSchema = createTicketSchema.shape.body;

////-----------------------------------------------------------------------------------------------////
////--------------------------10) Модуль Content-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------10.1) Схема для получения конкретной новости:-------------------------------------//
export const GetNewsSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .min(1, "slug мотоцикла обязателен")
      .max(50, "Максимум 50 символов для slug"),
  }),
});
export type GetNewsInput = z.infer<typeof GetNewsSchema>;
export type GetNewsServiceArgs = GetNewsInput["params"];

////-----------------------------------------------------------------------------------------------////
////--------------------------11) Прочее-------------------------------------------------------////
////-----------------------------------------------------------------------------------------------////
//----------------------------11.1) Схема для валидации .env на сервере:-------------------------------------//
// Вспомогательный валидатор для безопасной проверки нативных URL-адресов:
const safeUrl = z.string().refine(
  (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Должен быть валидным URL-адресом (например, http://localhost)" },
);

export const serverEnvSchema = z.object({
  //Основные домены и порты:
  API_URL: safeUrl,
  PORT: z
    .string()
    .default("3001")
    .transform((val) => parseInt(val, 10)),
  CLIENT_URL: safeUrl,
  //Подключение к Базам Данных:
  POSTGRES_USER: z.string().min(1, "POSTGRES_USER обязателен"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD обязателен"),
  POSTGRES_DB: z.string().min(1, "POSTGRES_DB обязателен"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL обязателен"),
  REDIS_HOST: z.string().min(1, "REDIS_HOST обязателен"),
  REDIS_PORT: z
    .string()
    .default("6379")
    .transform((val) => parseInt(val, 10)),

  MONGO_URI: z.string().min(1, "MONGO_URI обязателен"),
  //Системные сервисы (Elastic, Loki):
  ELASTIC_NODE: safeUrl,
  LOKI_URL: safeUrl,
  //Почтовый сервис (SMTP):
  SMTP_HOST: z.string().min(1, "SMTP_HOST обязателен"),
  SMTP_PORT: z
    .string()
    .default("587")
    .transform((val) => parseInt(val, 10)),
  SMTP_USER: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "SMTP_USER должен быть валидным email-адресом" })),
  SMTP_PASSWORD: z.string().min(8, "SMTP_PASSWORD слишком короткий"),
  //Аутентификация (JWT):
  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET слишком короткий"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET слишком короткий"),
  //OAuth Google & reCaptcha:
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID обязателен"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET обязателен"),
  GOOGLE_CALLBACK_URL: safeUrl,
  GOOGLE_RECAPTCHA_SECRET_KEY: z
    .string()
    .min(1, "GOOGLE_RECAPTCHA_SECRET_KEY обязателен"),
  //ЮKassa:
  YOOKASSA_SHOP_ID: z.string().min(1, "YOOKASSA_SHOP_ID обязателен"),
  YOOKASSA_SECRET_KEY: z.string().min(1, "YOOKASSA_SECRET_KEY обязателен"),
  YOOKASSA_RETURN_URL: safeUrl,
  YOOKASSA_IPS: z.string().min(1, "YOOKASSA_IPS обязателен"),
  //Telegram:
  TG_BOT_TOKEN: z.string().min(1, "TG_BOT_TOKEN обязателен"),
  TG_ADMIN_CHAT_ID: z.string().min(1, "TG_ADMIN_CHAT_ID обязателен"),
});
