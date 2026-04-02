import type { Meta, StoryObj } from "@storybook/react";

import { AddToCartButton } from "./AddToCartButton";

const meta = {
  title: "Features/Trading/AddToCartButton",
  component: AddToCartButton,
} satisfies Meta<typeof AddToCartButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {
  args: {
    data: { id: "99", model: "Honda CB500", price: 500000 },
  },
};

// Здесь мы можем замокать стор, чтобы показать состояние "В корзине"
export const InCart: Story = {
  args: { ...Initial.args },
  parameters: {
    // Если используешь storybook-addon-zustand или просто мокаешь стейт
  },
};
