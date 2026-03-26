import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Shared/Button", // Путь в боковой панели Storybook
  component: Button,
  parameters: {
    layout: "centered", // Центрируем кнопку на экране
  },
  tags: ["autodocs"], // Автоматически создаст документацию с кодом
};

export default meta;
type Story = StoryObj<typeof Button>;

//1) Обычная кнопка:
export const Primary: Story = {
  args: {
    children: "Войти в аккаунт",
    variant: "primary",
  },
};

//2) Кнопка в состоянии загрузки:
export const Loading: Story = {
  args: {
    children: "Отправка...",
    isLoading: true,
    disabled: true,
  },
};

//3) Заблокированная кнопка:
export const Disabled: Story = {
  args: {
    children: "Недоступно",
    disabled: true,
  },
};

//4) Вторичный вариант:
export const Secondary: Story = {
  args: {
    children: "Редактировать профиль",
    variant: "secondary",
  },
};
