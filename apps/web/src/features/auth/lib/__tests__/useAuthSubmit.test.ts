/**
 * @vitest-environment jsdom
 */

//-------------Интеграционный тест для имитирования поведения цепочки «Ввод данных -> Капча -> Запрос к серверу -> Уведомление -> Редирект».

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useAuthSubmit } from "../useAuthSubmit";
import { toast } from "react-hot-toast";

//--Мокаем зависимости, которые будут мешать:
//Подменяем reCAPTCHA:
vi.mock("react-google-recaptcha-v3", () => ({
  useGoogleReCaptcha: () => ({
    executeRecaptcha: vi.fn().mockResolvedValue("fake-captcha-token"),
  }),
}));

//Подменяем роутер:
const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

//Подменяем уведомления:
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

//-----------------------------------

describe("Тестируем хук useAuthSubmit", () => {
  it("Должен вызывать toast.success и делать редирект при успешном запросе", async () => {
    const { result } = renderHook(() => useAuthSubmit());

    //Имитируем успешный API вызов (он сразу возвращает успех ({data: {success: true }})):
    const mockApiCall = vi.fn().mockResolvedValue({ data: { success: true } });

    //Вызываем метод хука с тестовыми параметрами:
    await result.current.handleAuthSubmit(
      {
        action: "test",
        apiCall: mockApiCall,
        successMessage: "Успешно!",
        redirectPath: "/profile",
      },
      { email: "test@test.com" },
    );

    //Проверяем появление успешного уведомления:
    expect(toast.success).toHaveBeenCalledWith("Успешно!");

    //Проверяем редирект на страницу профиля:
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("Должен вызывать toast.error при ошибке сервера", async () => {
    const { result } = renderHook(() => useAuthSubmit());

    // Имитируем падение сервера (reject):
    const mockApiCall = vi.fn().mockRejectedValue({
      response: { data: { message: "Ошибка сервера" } },
    });

    //Оборачиваем в try/catch, чтобы тест не падал от "throw e":
    try {
      await result.current.handleAuthSubmit(
        {
          action: "test",
          apiCall: mockApiCall,
        },
        { email: "test@test.com" },
      );
    } catch (e) {}

    //Проверяем, что вызвался тост с ошибкой:
    expect(toast.error).toHaveBeenCalledWith("Ошибка сервера");
  });
});
