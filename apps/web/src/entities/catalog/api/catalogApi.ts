import axios from "axios";
import {
  type SiteCategory,
  type BrandResponse,
  type MotorcycleFilters,
  type MotorcycleResponse,
} from "../model/types";
import { API_URL } from "@/shared/api/api";

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

export const fetchMotorcycles = async (
  filters: MotorcycleFilters,
): Promise<MotorcycleResponse> => {
  const { data } = await axios.get(`${API_URL}/api/catalog/motorcycles`, {
    params: filters,
  });
  return data;
};
