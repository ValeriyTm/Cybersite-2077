/**
 * @vitest-environment jsdom
 */
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProtectedRoute } from "../ui/ProtectedRoute";
import { MemoryRouter, Routes, Route } from "react-router";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

//Создаем объект-заглушку, которую будем менять:
const authState = { isAuth: false };

vi.mock("@/features/auth/model/auth-store", () => ({
  //Хук будет всегда возвращать актуальное значение из authState:
  useAuthStore: vi.fn(() => authState),
}));

describe("ProtectedRoute - Безопасность роутинга", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("Нужно пропускать авторизованного пользователя к контенту", () => {
    //Меняем состояние на true перед рендером:
    authState.isAuth = true;

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Секретный профиль</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Секретный профиль")).toBeInTheDocument();
  });

  it("Нужно редиректить неавторизованного пользователя на /auth", () => {
    //Меняем состояние на false перед рендером:
    authState.isAuth = false;

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Секретный профиль</div>
              </ProtectedRoute>
            }
          />
          {/* Важно: роут /auth должен быть прямым ребенком Routes */}
          <Route path="/auth" element={<div>Страница входа</div>} />
        </Routes>
      </MemoryRouter>,
    );

    //Если редирект сработал, "секретный профиль" исчезнет из DOM:
    expect(screen.queryByText("Секретный профиль")).not.toBeInTheDocument();
    expect(screen.getByText("Страница входа")).toBeInTheDocument();
  });
});
