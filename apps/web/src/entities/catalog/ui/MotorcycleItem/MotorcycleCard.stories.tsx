import type { Meta, StoryObj } from "@storybook/react";
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
      brand: "Kawasaki",
      brandSlug: "kawasaki",
      category: "ENDURO_OFFROAD",
      createdAt: "2026-04-12T13:04:10.917Z",
      discountData: {
        discountPercent: 10,
        finalPrice: 900000,
        originalPrice: 1000000,
        isPersonal: false
      },
      displacement: 998,
      id: "afa8c1df-2619-4d06-8af7-4d39eb809f78",
      mainImage: "yamaha-125-mx1974.jpg",
      model: "Yamaha YZF-R1",
      power: 200,
      price: 1000000,
      rating: 4.9,
      slug: "yzf-r1-2023",
      totalInStock: 4,
      transmission: 'CHAIN',
      year: 2023,
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
