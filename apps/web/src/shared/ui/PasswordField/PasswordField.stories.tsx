import type { Meta, StoryObj } from "@storybook/react";
import { PasswordField } from "./PasswordField";

const meta: Meta<typeof PasswordField> = {
  title: "Features/Auth/PasswordField",
  component: PasswordField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  // Мокаем registration, чтобы React Hook Form не выдавал ошибки
  args: {
    label: "Пароль",
    registration: {
      name: "password",
      onChange: async () => {},
      onBlur: async () => {},
      ref: () => {},
    } as any,
  },
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

//1) Стандартный вид:
export const Default: Story = {
  args: {
    placeholder: "Введите пароль",
  },
};

//2) Состояние с ошибкой:
export const WithError: Story = {
  args: {
    error: { type: "required", message: "Пароль слишком простой" } as any,
  },
};

//3) Состояние без переключателя "глаза":
export const NoToggle: Story = {
  args: {
    showToggle: false,
  },
};
