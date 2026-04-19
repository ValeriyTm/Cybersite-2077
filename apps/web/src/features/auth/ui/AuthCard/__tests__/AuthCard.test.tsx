/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthCard } from "../AuthCard";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { API_URL } from "@/shared/api/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe("Вход/регистрация через Google (OAuth)", () => {
  beforeEach(() => {
    //Используем заглушку для глобального объекта location, что позволяет менять href
    vi.stubGlobal("location", {
      ...window.location,
      href: "",
    });
  });

  it("Должен происходить редирект на бэкенд Google OAuth при клике на кнопку", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthCard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    //Находим кнопки Google (в AuthCard их две: в логине и регистрации):
    const googleButtons = screen.getAllByRole("button", { name: /google/i });

    // Кликаем по первой кнопке (Пункт 5.1)
    fireEvent.click(googleButtons[0]);

    //Проверяем значение в нашей заглушке
    expect(window.location.href).toBe(
      `${API_URL}/api/identity/auth/google`,
    );
  });
});
