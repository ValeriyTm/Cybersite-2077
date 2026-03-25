/**
 * @vitest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProfileActions } from "../useProfileActions";
import { toast } from "react-hot-toast";
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
      delete: vi.fn(), // <--- ДОБАВЬ ЭТО 🚀
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

//1.6. Мокаем клиентское хранилище:
const mockClearAuth = vi.fn();
const mockSetUser = vi.fn();

vi.mock("../../model/auth-store", () => ({
  useAuthStore: () => ({
    clearAuth: mockClearAuth,
    setUser: mockSetUser,
  }),
}));

//2) Тесты:
describe("Тест хука useProfileActions - действия в профиле", () => {
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

  it("Тест №3. Должен вызываться API смены пароля и показываться toast", async () => {
    // 1. Настраиваем фейковый успешный ответ для смены пароля (POST запрос)
    vi.mocked($api.post).mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useProfileActions(mockUser as any));

    //Данные для смены пароля:
    const passwordData = {
      oldPassword: "old-password123",
      newPassword: "new-password123",
      confirmPassword: "new-password123",
    };

    //Вызываем метод смены пароля:
    await act(async () => {
      await result.current.onChangePassword(passwordData);
    });

    //Проверяем, что запрос ушел на правильный эндпоинт с данными:
    expect($api.post).toHaveBeenCalledWith(
      "/identity/auth/change-password",
      passwordData,
    );

    //Проверяем наличие уведомления об успехе:
    expect(toast.success).toHaveBeenCalledWith("Пароль успешно изменен");

    //Проверяем, что форма очистилась после успеха:
    await waitFor(() => {
      const values = result.current.passForm.getValues();
      //Проверяем, что поле стало либо пустой строкой:
      expect(values.oldPassword || "").toBe("");
    });
  });

  it("Тест №4. Проверяем функционал удаления аккаунта в профиле", async () => {
    //Настраиваем фейковый успешный ответ для метода DELETE:
    vi.mocked($api.delete).mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useProfileActions(mockUser as any));

    //Данные из формы (DeleteAccountInput):
    const deleteData = {
      password: "correct-password123",
      confirmPassword: "correct-password123",
    };

    await act(async () => {
      await result.current.onDeleteAccount(deleteData);
    });

    //Проверяем метод DELETE и структуру { data: ... }:
    expect($api.delete).toHaveBeenCalledWith("/identity/auth/delete-account", {
      data: { password: deleteData.confirmPassword },
    });

    //Проверяем уведомление и выход (вызов clearAuth через logout):
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Ваш аккаунт удален");
      expect(mockClearAuth).toHaveBeenCalled();
    });
  });

  it("Тест №5. Должен загружаться файл аватара и обновляться кэш", async () => {
    // 1. Настраиваем фейковый успешный ответ сервера (возвращаем путь к новому аватару)
    vi.mocked($api.post).mockResolvedValue({
      data: { avatarUrl: "/uploads/avatars/new-avatar.jpg" },
    });

    const { result } = renderHook(() => useProfileActions(mockUser as any));

    // 2. Имитируем выбор файла пользователем
    const file = new File(["hello"], "avatar.png", { type: "image/png" });
    const event = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    // 3. Вызываем обработчик загрузки
    await act(async () => {
      await result.current.handleAvatarChange(event);
    });

    // 4. ПРОВЕРКИ:
    // Проверяем, что запрос ушел на правильный эндпоинт
    expect($api.post).toHaveBeenCalledWith(
      "/identity/profile/avatar",
      expect.any(FormData),
    );

    // САМОЕ ВАЖНОЕ (Пункт 10.1): инвалидация, чтобы картинка обновилась в UI
    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["profile"] });
    });

    expect(toast.success).toHaveBeenCalledWith("Аватар обновлен");
  });
});
