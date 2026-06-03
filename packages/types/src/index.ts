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
  | "SUPERADMIN"
  | "WATCHER";

//Типизируем пол:
export type UserGender = "MALE" | "FEMALE" | null; //null, т.к. поле опциональное

//Типизируем данные юзера:
export interface IUser {
  email: string;
  name: string;
  id: string;
  phone: string | null;
  birthday: string | null; //Сервер отправляет Date | null, но Date будет преобразовано в string
  gender: UserGender;
  role: UserRole;
  isActivated: boolean;
  avatarUrl: string | null;
  createdAt: string;
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
  brandSlug?: never;
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
  siteCategory: {
    createdAt: Date;
    description: string | null;
    id: string;
    imageUrl: string | null;
    name: string;
    slug: string;
    updatedAt: Date;
  };
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

//Тип для преобразования Date в string
type DeepSerializeDates<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: DeepSerializeDates<T[K]> }
    : T;

//Фронтендерский тип отличается тем, что там вместо Date будет string:
export type MotorcycleFull = DeepSerializeDates<MotorcycleFullServer>;

export interface ProductCategory {
  description: string | null;
  id: string;
  imageUrl: string | null;
  motorcyclesCount: number;
  name: string;
  slug: string;
}
