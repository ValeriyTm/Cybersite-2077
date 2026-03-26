import type { Meta, StoryObj } from "@storybook/react";
import { AuthCard } from "./AuthCard";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

//Создаем тестовый клиент для React Query:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof AuthCard> = {
  title: "Features/Auth/AuthCard",
  component: AuthCard,
  //Обертка (декораторы) для всех историй этого компонента:
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {/* Ограничиваем ширину, как в реальной верстке:*/}
          <div style={{ maxWidth: "450px", margin: "0 auto", padding: "20px" }}>
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AuthCard>;

//Форма логина:
export const LoginView: Story = {
  args: {
    initialMode: "login", // Используем наш новый пропс
  },
};

//Форма регистрации:
export const RegisterView: Story = {
  args: {
    initialMode: "register", // Используем наш новый пропс
  },
};
