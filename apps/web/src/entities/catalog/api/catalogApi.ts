//-------------Тут описано взаимодействие с API бэкенда----------------//
//Типы:
import {
  type SiteCategory,
  type BrandResponse,
  type MotorcycleFilters,
  type MotorcycleResponse,
  type MotorcycleFull,
} from "../model/types";
//API:
import { $api } from "@/shared/api";

//Получить категории каталога (мотоциклы, мотоэкип, запчасти):
export const fetchSiteCategories = async (): Promise<SiteCategory[]> => {
  const { data } = await $api.get("/catalog/categories");
  return data;
};

//Получить бренды каталога:
export const fetchBrands = async (
  page: number = 1,
  limit: number = 24,
  search?: string,
): Promise<BrandResponse> => {
  const { data } = await $api.get(`/catalog/brands`, {
    params: { page, limit, search },
  });
  return data;
};

//Получить все модели мотоциклов конкретного бренда:
export const fetchMotorcycles = async (
  filters: MotorcycleFilters,
): Promise<MotorcycleResponse> => {
  const { data } = await $api.get(`/catalog/motorcycles`, {
    params: filters,
  });
  return data;
};

//Получить конкретный мотоцикл:
export const fetchMotorcycleBySlug = async (
  brandSlug: string,
  slug: string,
): Promise<MotorcycleFull> => {
  const { data } = await $api.get(`/catalog/motorcycles/${brandSlug}/${slug}`);
  return data;
};
