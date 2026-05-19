import type {
  TransmissionType,
  MotoCategory,
  CoolingType,
  StarterType,
  GearboxType,
} from "@repo/database/generated/prisma/index.js";
import { type MotorcycleFull, type MotorcycleStocks } from "@repo/types";

export interface Brand {
  country: string;
  id: string;
  image: string;
  motorcyclesCount: number;
  name: string;
  slug: string;
}

export interface BrandResponse {
  items: Brand[];
  total: number;
  page: number;
  pages: number;
}

export interface MotorcycleFilters {
  brandSlug: string;
  search: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  category?: MotoCategory;
  minDisplacement?: number;
  maxDisplacement?: number;
  minPower?: number;
  maxPower?: number;
  transmission?: string;
  minRating?: number;
  page?: number;
  sortBy?: string;
}

export interface MotorcycleShort {
  brand: string;
  brandSlug: string;
  category: MotoCategory;
  createdAt: string;
  discountData: {
    originalPrice: number;
    finalPrice: number;
    discountPercent: number | null;
    isPersonal: boolean;
  };
  displacement: number;
  id: string;
  mainImage: string;
  model: string;
  power: number | null;
  price: number;
  rating: number;
  slug: string;
  totalInStock: number;
  transmission: TransmissionType | null;
  year: number;
}

export interface MotorcycleCart extends MotorcycleFull {
  quantity: number;
  selected: boolean;
}

export interface MotorcycleEditAdmin {
  brand: {
    name: string;
  };
  brandId: string;
  category: MotoCategory;
  colors: string[];
  comments: string | null;
  coolingSystem: CoolingType;
  createdAt: string;
  displacement: number;
  engineType: string | null;
  id: string;
  images: {
    createdAt: Date;
    id: string;
    isMain: boolean;
    motorcycleId: string;
    url: string;
  }[];
  model: string;
  power: number | null;
  price: number;
  rating: number;
  rearBrakes: string | null;
  rearTyre: string | null;
  siteCategoryId: string;
  slug: string;
  starter: StarterType | null;
  topSpeed: number | null;
  transmission: TransmissionType | null;
  updatedAt: string;
  year: number;
}

export interface MotorcycleAdminSend {
  brand: string;
  brandId: string;
  category: MotoCategory;
  colors: string[];
  comments: string | null;
  coolingSystem: CoolingType | null;
  createdAt: string;
  displacement: number;
  engineType: string | null;
  frontBrakes: string | null;
  frontTyre: string | null;
  fuelConsumption: number | null;
  fuelSystem: string | null;
  gearbox: GearboxType | null;
  id: string;
  images: {
    createdAt: string;
    id: string;
    isMain: boolean;
    motorcycleId: string;
    url: string;
  }[];
  model: string;
  power: number | null;
  price: number;
  rating: number;
  rearBrakes: string | null;
  rearTyre: string | null;
  siteCategory: string;
  siteCategoryId: string;
  slug: string;
  starter: StarterType | null;
  topSpeed: number | null;
  transmission: TransmissionType | null;
  updatedAt: string;
  year: number;
}

export interface MotorcycleResponse {
  items: MotorcycleShort[];
  total: number;
  page: number;
  pages: number;
}

export interface MotorcycleReview {
  _id: string;
  motorcycleId: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  __v: number;
}
