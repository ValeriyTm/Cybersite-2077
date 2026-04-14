//-------------Тут описано взаимодействие с API бэкенда----------------//
import axios from "axios";
//Типы:
import {
  type SiteCategory,
  type BrandResponse,
  type MotorcycleFilters,
  type MotorcycleResponse,
  type MotorcycleShort,
  type MotorcycleFull,
} from "../model/types";
//API:
import { API_URL } from "@/shared/api/api";
import { $api } from "@/shared/api/api";

//Получить категории каталога (мотоциклы, мотоэкип, запчасти):
export const fetchSiteCategories = async (): Promise<SiteCategory[]> => {
  const { data } = await axios.get(`${API_URL}/api/catalog/categories`);
  return data;
};

//Получить бренды каталога:
export const fetchBrands = async (
  page: number = 1,
  limit: number = 24,
  search?: string,
): Promise<BrandResponse> => {
  const { data } = await axios.get(`${API_URL}/api/catalog/brands`, {
    params: { page, limit, search },
  });
  return data;
};

//Получить все модели мотоциклов конкретного бренда:
export const fetchMotorcycles = async (
  filters: MotorcycleFilters,
): Promise<MotorcycleResponse> => {
  const { data } = await axios.get(`${API_URL}/api/catalog/motorcycles`, {
    params: filters,
  });
  return data;
};

//Получить конкретный мотоцикл:
export const fetchMotorcycleBySlug = async (
  brandSlug: string,
  slug: string,
): Promise<MotorcycleFull> => {
  const { data } = await axios.get(
    `${API_URL}/api/catalog/motorcycles/${brandSlug}/${slug}`,
  );
  return data;
};
