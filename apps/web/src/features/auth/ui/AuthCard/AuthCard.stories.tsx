import type { Meta, StoryObj } from "@storybook/react";
import { AuthCard } from "./AuthCard";

const meta: Meta<typeof AuthCard> = {
  title: "Features/Auth/AuthCard",
  component: AuthCard,
  //Обертка (декораторы) для всех историй этого компонента:
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "450px", margin: "0 auto", padding: "20px" }}>
        <Story />
      </div>
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
