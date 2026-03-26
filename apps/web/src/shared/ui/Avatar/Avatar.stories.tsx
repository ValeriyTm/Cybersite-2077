import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Shared/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

//1) Обычный вид:
export const Default: Story = {
  args: {
    src: "https://avatars.githubusercontent.com/u/1?v=4",
  },
};

//2) Состояние загрузки:
export const Loading: Story = {
  args: {
    src: "https://avatars.githubusercontent.com/u/2?v=4",
    isAvatarLoading: true,
  },
};

//3) Режим редактирования:
export const Editing: Story = {
  args: {
    src: "https://avatars.githubusercontent.com/u/3?v=4",
    isEditing: true,
  },
};

//4) Без фото:
export const NoImage: Story = {
  args: {
    src: "",
  },
};
