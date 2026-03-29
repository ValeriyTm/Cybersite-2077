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
}

export interface BrandResponse {
  items: Brand[];
  total: number;
  page: number;
  pages: number;
}

export interface MotorcycleFilters {
  brandSlug: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  category?: string;
  minDisplacement?: number;
  maxDisplacement?: number;
  minPower?: number;
  transmission?: string;
  minRating?: number;
  page?: number;
  sortBy?: string;
}

export interface MotorcycleShort {
  id: string;
  model: string;
  slug: string;
  brand: { name: string; country: string; slug: string };
  brandSlug: string; // Для роутинга
  year: number;
  price: number;
  displacement: number;
  power: number;
  rating: number;
  mainImage: string;
}

export interface MotorcycleFull extends MotorcycleShort {
  category: string;
  topSpeed: number;
  fuelConsumption: number;
  engineType: string;
  fuelSystem: string;
  coolingSystem: string;
  gearbox: string;
  transmission: string;
  frontTyre: string;
  rearTyre: string;
  frontBrakes: string;
  rearBrakes: string;
  colors: string[];
  starter: string;
  comments: string;
  images: { id: string; url: string; isMain: boolean }[];
}

export interface MotorcycleResponse {
  items: MotorcycleShort[];
  total: number;
  page: number;
  pages: number;
}
