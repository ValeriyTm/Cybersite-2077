//API:
import { API_URL } from "@/shared/api";
//Типы:
import { type MotorcycleShort } from "@/entities/catalog/model";
import type { MotorcycleFull } from "@repo/types";

const STATIC_URL = `${API_URL}/static`;

export type MotorcycleDataType = MotorcycleShort | MotorcycleFull;

//Извлекаем главную картинку мотоцикла в зависимости от формата входных данных:
export const extractMainImage = (
  data: MotorcycleDataType,
): string | null | undefined => {
  if ("mainImage" in data) {
    return data.mainImage; // Если это MotorcycleShort, берем плоскую строку
  }
  return data.images?.find((img) => img.isMain)?.url; // Если это MotorcycleFull (из избранного)
};

//Формируем полный URL изображения для отображения в карточке:
export const getMotoImageUrl = (
  path: string | null | undefined,
  defaultImage: string,
): string => {
  if (!path) return defaultImage;

  //Если в базе путь начинается с "/", просто добавляем статический домен:
  if (path.startsWith("/")) {
    return `${STATIC_URL}${path}`;
  }

  //Если это просто имя файла ("yamaha-r1.jpg"), ищем в папке motorcycles:
  return `${STATIC_URL}/motorcycles/${path}`;
};

//Формируем URL изображения для передачи в объект корзины:
export const getCartImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  return `${STATIC_URL}/motorcycles/${path}`;
};

//Извлекаем человекочитаемое имя бренда в зависимости от формата данных:
export const extractBrandName = (data: MotorcycleDataType): string => {
  return typeof data.brand === "object" ? data.brand.name : data.brand;
};

//Рассчитываем финальные цены и флаги скидок:
export const getDiscountInfo = (data: MotorcycleDataType) => {
  const currentPrice = data.discountData?.finalPrice ?? data.price;
  const hasDiscount = Number(data.discountData?.discountPercent) > 0;
  const isPersonalDiscount = !!data.discountData?.isPersonal;
  const discountPercent = data.discountData?.discountPercent ?? 0;

  return {
    currentPrice,
    hasDiscount,
    isPersonalDiscount,
    discountPercent,
  };
};
