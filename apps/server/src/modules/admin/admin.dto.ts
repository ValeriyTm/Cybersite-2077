import type {
  StarterType,
  TransmissionType,
  GearboxType,
  CoolingType,
  MotoCategory,
} from "@repo/database/generated/prisma/index.js";

export interface CreateMotorcycleDto {
  colors?: string[];
  model: string;
  year: string;
  brandId: string;
  category: MotoCategory;
  price: string;
  displacement?: string | null;
  power?: string | number;
  coolingSystem: CoolingType | null;
  gearbox: GearboxType | null;
  transmission: TransmissionType | null;
  starter: StarterType | null;
  comments: string;
  siteCategory: string;
}
