import type {
  StarterType,
  TransmissionType,
  GearboxType,
  CoolingType,
  MotoCategory,
} from "@repo/database/generated/prisma/index.js";

//Типизируем роли:
export type UserRole =
  | "USER"
  | "MANAGER"
  | "CONTENT_EDITOR"
  | "ADMIN"
  | "SUPERADMIN";

//Типизируем пол:
export type UserGender = "MALE" | "FEMALE" | null; //null, т.к. поле опциональное

//Типизируем данные юзера:
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  phone: string | null;
  birthday: string | null; //Сервер отправляет Date | null, но Date будет преобразовано в string
  gender: UserGender;
  is2FAEnabled: boolean;
  defaultAddress: string | null;
  defaultLat: number | null;
  defaultLng: number | null;
}

//Типизируем ответ при авторизации:
export interface AuthResponse {
  accessToken: string;
  user: IUser;
}

//---------Типы для мотоцикла из каталога:-------------//
export interface MotorcycleStocks {
  quantity: number;
  reserved: number;
}

export interface MotorcycleFullServer {
  brand: {
    country: string;
    createdAt: Date;
    id: string;
    image: string;
    name: string;
    slug: string;
    updatedAt: Date;
  };
  brandId: string;
  category: MotoCategory;
  colors: string[];
  comments: string | null;
  coolingSystem: CoolingType | null;
  createdAt: Date;
  discountData: {
    originalPrice: number;
    finalPrice: number;
    discountPercent: number | null;
    isPersonal: boolean;
  };
  displacement: number;
  engineType: string | null;
  frontBrakes: string | null;
  frontTyre: string | null;
  fuelConsumption: number | null;
  fuelSystem: string | null;
  gearbox: GearboxType | null;
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
  siteCategory: SiteCategoryServer;
  siteCategoryId: string;
  slug: string;
  starter: StarterType | null;
  stocks: MotorcycleStocks[];
  topSpeed: number | null;
  totalInStock: number;
  transmission: TransmissionType | null;
  updatedAt: Date;
  year: number;
}

export interface SiteCategoryServer {
  createdAt: Date;
  description: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
  slug: string;
  updatedAt: Date;
}

type DeepSerializeDates<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: DeepSerializeDates<T[K]> }
    : T;

//Фронтендерские типы отличаются тем, что там вместо Date будет string:
export type SiteCategory = DeepSerializeDates<SiteCategoryServer>;
export type MotorcycleFull = DeepSerializeDates<MotorcycleFullServer>;
