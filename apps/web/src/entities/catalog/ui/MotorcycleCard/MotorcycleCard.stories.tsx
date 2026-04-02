import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router";
import { MotorcycleCard } from "./MotorcycleCard";

const meta = {
  title: "Entities/Catalog/MotorcycleCard",
  component: MotorcycleCard,
  tags: ["autodocs"],
} satisfies Meta<typeof MotorcycleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

//1.Дефолтное состояние (grid):
export const DefaultGrid: Story = {
  args: {
    viewMode: "grid",
    data: {
      id: "1",
      model: "Yamaha YZF-R1",
      brand: "Yamaha",
      brandSlug: "yamaha",
      slug: "yzf-r1-2023",
      year: 2023,
      displacement: 998,
      power: 200,
      price: 1850000,
      rating: 4.9,
      mainImage: "/motorcycles/yamaha-125-mx1974.jpg",
    },
  },
};

//2.Режим list:
export const ListView: Story = {
  args: {
    ...DefaultGrid.args,
    viewMode: "list",
  },
};

//3.Без изображения:
export const NoImage: Story = {
  args: {
    viewMode: "grid",
    data: {
      ...DefaultGrid.args!.data!,
      mainImage: "",
    },
  },
};

//4.Длинное название (проверка верстки):
export const LongName: Story = {
  args: {
    viewMode: "grid",
    data: {
      ...DefaultGrid.args!.data!,
      model:
        "Super Ultra Mega Custom Limited Edition Motorcycle 1200 S Special",
    },
  },
};
