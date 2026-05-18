//-------------Тут описано взаимодействие с API бэкенда со стороны модуля Catalog----------------//
//Типы:
import { type BrandResponse } from "../model/types";
import { type SiteCategory } from "@repo/types";
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
