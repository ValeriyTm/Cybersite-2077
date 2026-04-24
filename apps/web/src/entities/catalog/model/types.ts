export interface SiteCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  motorcyclesCount: number;
}

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
  category?: string;
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
  category: string;
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
  transmission: "CHAIN";
  year: number;
}

export interface MotorcycleFull {
  brand: {
    country: string;
    createdAt: string;
    id: string;
    image: string;
    name: string;
    slug: string;
    updatedAt: string;
  };
  brandId: string;
  colors: string[];
  comments: string;
  coolingSystem: string;
  engineType: string;
  frontBrakes: string;
  frontTyre: string;
  fuelConsumption: number;
  fuelSystem: string | null;
  gearbox: string;
  images: string[];
  rearBrakes: string;
  rearTyre: string;
  siteCategory: {
    createdAt: string;
    description: string;
    id: string;
    imageUrl: string | null;
    name: string;
    slug: string;
    updatedAt: string;
  };
  siteCategoryId: string;
  starter: string;
  stocks: MotorcycleStocks[];
  topSpeed: number;
  updatedAt: string;
  // images: { id: string; url: string; isMain: boolean }[];
  brandSlug: string; //Для роутинга
  category: string;
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
  transmission: "CHAIN";
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

export interface MotorcycleStocks {
  quantity: number;
  reserved: number;
}
