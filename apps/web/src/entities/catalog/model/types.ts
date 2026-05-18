import type {
  TransmissionType,
  MotoCategory,
} from "@repo/database/generated/prisma/index.js";
import { type MotorcycleFull } from "@repo/types";

export interface Brand {
  id: string;
  name: string;
  country: string;
  slug: string;
  motorcyclesCount: number;
  image: string;
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
  brandSlug: string; //Для роутинга
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
  power: number;
  price: number;
  rating: number;
  slug: string;
  totalInStock: number;
  transmission: TransmissionType;
  year: number;
}

export interface MotorcycleCart extends MotorcycleFull {
  quantity: number;
  selected: boolean;
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
