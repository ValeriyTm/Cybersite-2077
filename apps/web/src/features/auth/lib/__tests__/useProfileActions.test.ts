/**
 * @vitest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProfileActions } from "../useProfileActions";
import { toast } from "react-hot-toast";
// Импортируем $api через относительный путь, чтобы Vitest его точно нашел
import { $api } from "../../../../shared/api/api";

//0) Создаем шпионов, чтобы иметь к ним прямой доступ:
const mockInvalidate = vi.fn(); //vi.fn() - записывает всё, что с ним происходит: сколько раз его вызывали и с какими аргументами.
const mockQueryClient = {
  invalidateQueries: mockInvalidate,
  //Создали объект, который имитирует реальный клиент React Query. Теперь, когда твой код вызовет
  //invalidateQueries, на самом деле сработает шпион mockInvalidate.
};

//1) Мокаем зависимости
//1.1. Мок React Query:
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    // Теперь и хук, и тест получат один и тот же mockQueryClient
    useQueryClient: vi.fn(() => mockQueryClient),
    useQuery: vi.fn(() => ({ data: null, isLoading: false })),
  };
});

//1.2. Мокаем API (сохраняем константы типа API_URL через importOriginal):
vi.mock("../../../../shared/api/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../shared/api/api")>();
  return {
    ...actual,
    $api: {
      patch: vi.fn(),
      post: vi.fn(),
    },
  };
});

//1.3. Мокаем роутер:
vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

//1.4. Мокаем reCAPTCHA:
vi.mock("react-google-recaptcha-v3", () => ({
  useGoogleReCaptcha: () => ({
    executeRecaptcha: vi.fn().mockResolvedValue("fake-token"),
  }),
}));

//1.5. Мокаем уведомления:
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

//2) Тесты:
describe("useProfileActions - Интеграция профиля (Пункт 11.3)", () => {
  const mockUser = { id: "1", name: "Ivan", email: "ivan@test.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Тест №1. Должна произойти инициализация компонента profileForm данными пользователя", () => {
    const { result } = renderHook(() => useProfileActions(mockUser as any));
    expect(result.current.profileForm.getValues("name")).toBe("Ivan");
  });

  it("Тест №2. Должна происходить инвалидация кэша ['profile'] после успешного обновления", async () => {
    //Настраиваем фейковый успешный ответ от сервера:
    vi.mocked($api.patch).mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useProfileActions(mockUser as any));

    //act заставляет Vitest дождаться, пока все изменения стейтов внутри хука завершатся, прежде чем идти дальше:
    await act(async () => {
      await result.current.onSubmit({
        name: "Ivan Updated",
        birthday: null,
      });
      //Имитируем нажатие кнопки «Сохранить». В этот момент хук внутри себя берет токен капчи, шлет запрос через $api.patch и ждет ответа.
    });

    //Проверяем шпиона mockInvalidate:
    await waitFor(
      () => {
        expect(mockInvalidate).toHaveBeenCalledWith({
          queryKey: ["profile"],
        });
      },
      { timeout: 2000 },
    ); //Даём время на асинхронность (так как запрос асинхронный, expect может сработать слишком рано)

    expect(toast.success).toHaveBeenCalledWith("Профиль обновлен");
  });
});
