import { describe, it, expect } from "vitest";
//Схемы валидации Zod:
import { RegisterFormSchema, LoginSchema } from "../index";

describe("Тест №1. Проверка валидации регистрации (Zod-схема RegisterFormSchema)", () => {
  //Проверяем, что, если при регистрации введен в поле подтверждения пароля не аналогичный пароль, то будет выыведен определенынй текст ошибки:
  it("Тест №1.1: Должна быть ошибка из-за не совпадения пароля и пароля подтверждения", () => {
    const data = {
      email: "test@test.com",
      name: "Ivan",
      password: "Password123",
      confirmPassword: "WrongPassword",
      captchaToken: "test-token",
      acceptTerms: true,
    };

    const result = RegisterFormSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format() as any;
      const errorMessage = formatted.confirmPassword?._errors[0];

      expect(errorMessage).toBe("Введенные пароли не совпадают");
    }
  });

  it("Тест №1.2: Должна быть ошибка из-за не корректных значений в полях email, name, acceptTerms", () => {
    const data = {
      email: "test@@test.com",
      name: "Iv",
      password: "Pass",
      confirmPassword: "Pass",
      captchaToken: "test-token",
      acceptTerms: false,
    };

    const result = RegisterFormSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format() as any;
      expect(formatted.email?._errors[0]).toBe(
        "Введите корректный адрес электронной почты",
      );
      expect(formatted.name?._errors[0]).toBe("Имя слишком короткое");
      expect(formatted.password?._errors[0]).toBe(
        "Пароль должен иметь минимум 8 символов",
      );
      expect(formatted.acceptTerms?._errors[0]).toBe(
        "Нужно ваше согласие на обработку данных",
      );
    }
  });

  it("Тест №1.3: Должна быть ошибка из-за не корректных значений в полях email, name, acceptTerms", () => {
    const data = {
      email: "!test@test.com",
      name: "Iv@n*99",
      password:
        "PasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPassword",
      confirmPassword:
        "PasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPassword",
      captchaToken: "test-token",
      acceptTerms: true,
    };

    const result = RegisterFormSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format() as any;
      expect(formatted.email?._errors[0]).toBe(
        "Введите корректный адрес электронной почты",
      );
      expect(formatted.name?._errors[0]).toBe(
        "Для имени используйте только латиницу, цифры и нижнее подчеркивание",
      );
      expect(formatted.password?._errors[0]).toBe(
        "Пароль должен иметь максимум 32 символа",
      );
    }
  });

  it("Тест №1.4: Должна быть ошибка из-за отсутствия заглавных букв в пароле", () => {
    const data = {
      email: "test@test.com",
      name: "Ivan",
      password: "superpassword99!",
      confirmPassword: "superpassword99!",
      captchaToken: "test-token",
      acceptTerms: true,
    };

    const result = RegisterFormSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format() as any;
      expect(formatted.password?._errors[0]).toBe(
        "В пароле нужна хотя бы одна заглавная буква",
      );
    }
  });

  it("Тест №1.5: Должна быть ошибка из-за отсутствия строчных букв в пароле", () => {
    const data = {
      email: "test@test.com",
      name: "Ivan",
      password: "SUPERPASSWORD99!",
      confirmPassword: "SUPERPASSWORD99!",
      captchaToken: "test-token",
      acceptTerms: true,
    };

    const result = RegisterFormSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format() as any;
      expect(formatted.password?._errors[0]).toBe(
        "В пароле нужна хотя бы одна строчная буква",
      );
    }
  });

  it("Тест №1.6: Должна быть ошибка из-за цифр в пароле", () => {
    const data = {
      email: "test@test.com",
      name: "Ivan",
      password: "superPASSWORD!",
      confirmPassword: "superPASSWORD!",
      captchaToken: "test-token",
      acceptTerms: true,
    };

    const result = RegisterFormSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format() as any;
      expect(formatted.password?._errors[0]).toBe(
        "В пароле нужна хотя бы одна цифра",
      );
    }
  });

  //Проверяем, что при передаче данных должен присутствовать captchaToken:
  it("Тест №1.7: Должна требоваться проверка captchaToken", () => {
    const data = {
      email: "test@test.com",
      name: "Ivan",
      password: "Password123",
      confirmPassword: "Password123",
      acceptTerms: true,
      // captchaToken пропущен
    };

    const result = RegisterFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("Тест №2. Проверка валидации входа (Zod-схема LoginSchema)", () => {
  it("Тест №2.1: Должна быть ошибка, если формат email неверный", () => {
    const data = {
      email: "not-an-email",
      password: "Password123",
      captchaToken: "test-token",
    };

    const result = LoginSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format();
      // Проверяем, что ошибка именно в поле email
      expect(formatted.email?._errors[0]).toBe("Некорректный email или пароль");
    }
  });

  it("Тест №2.2: Должна быть ошибка, если пароль слишком короткий", () => {
    const data = {
      email: "test@test.com",
      password: "123",
      captchaToken: "test-token",
    };

    const result = LoginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("Тест №2.3: Должна требоваться капча", () => {
    const data = {
      email: "test@test.com",
      password: "Password123",
      //Поле "captchaToken" пропущено
    };

    const result = LoginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
