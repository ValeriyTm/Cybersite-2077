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
