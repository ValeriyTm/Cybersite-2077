import { API_URL } from "@/shared/api";
import { type MotorcycleFull } from "@repo/types";

//----------------------------Словари:-------------------//
export const STARTER_MAP = {
  KICK: "Кикстартер",
  ELECTRIC: "Электростартер",
  ELECTRIC_KICK: "Электро- и кикстартер",
};

export const TRANSMISSION_MAP = {
  BELT: "Ременная передача",
  CHAIN: "Цепная передача",
  CARDAN: "Карданная передача",
};

export const COOLING_MAP = {
  LIQUID: "Жидкостное охлаждение",
  AIR: "Воздушное охлаждение",
  OIL_AIR: "Воздушное и жидкостное охлаждение",
};

export const GEARBOX_MAP = {
  SPEED1: "Одноступенчатая",
  SPEED2: "Двухступенчатая",
  SPEED2AUTOMATIC: "Двухступенчатая автоматическая",
  SPEED3: "Трехступенчатая",
  SPEED3AUTOMATIC: "Трехступенчатая автоматическая",
  SPEED4: "Четырехступенчатая",
  SPEED4WITHREVERSE: "Четырехступенчатая с задней передачей",
  SPEED5: "Пятиступенчатая",
  SPEED5WITHREVERSE: "Пятиступенчатая с задней передачей",
  SPEED6: "Шестиступенчатая",
  SPEED6WITHREVERSE: "Шестиступенчатая с задней передачей",
  SPEED7: "Семиступенчатая",
  SPEED8: "Восьмиступенчатая",
  AUTOMATIC: "Автоматическая",
};

export const CATEGORY_MAP = {
  ALLROUND: "Универсальный",
  ATV: "Квадроцикл",
  CLASSIC: "Классический",
  CROSS_MOTOCROSS: "Кросс/мотокросс",
  CUSTOM_CRUISER: "Кастом/круизер",
  ENDURO_OFFROAD: "Эндуро",
  MINIBIKE_CROSS: "Минибайк, кросс",
  MINIBIKE_SPORT: "Минибайк, спорт",
  NAKED_BIKE: "Нейкед (стрит)",
  PROTOTYPE_CONCEPT: "Прототип/концепт",
  SCOOTER: "Скутер",
  SPEEDWAY: "Трековый",
  SPORT: "Спортбайк",
  SPORT_TOURING: "Спорт-туринг",
  SUPER_MOTARD: "Супермото",
  TOURING: "Туристический",
  TRIAL: "Trial",
  UNSPECIFIED: "Не классифицировано",
};

//----------------------------Утилиты:-------------------//
//Генерируем объект микроразметки JSON-LD:
export const generateMotorcycleJsonLd = (
  motorcycle: MotorcycleFull,
  brandSlug: string | undefined,
  slug: string | undefined,
) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.host;
  const mainImgName =
    motorcycle.images?.find((img) => img.isMain)?.url ||
    motorcycle.images?.[0]?.url ||
    "";
  const imageUrl = `${API_URL}/static/motorcycles/${mainImgName}`;
  const productUrl = `http://${siteUrl}/catalog/motorcycles/${brandSlug}/${slug}`;

  const gearboxLabel =
    (motorcycle.gearbox && GEARBOX_MAP[motorcycle.gearbox]) || "Нет данных";
  const coolingLabel =
    (motorcycle.coolingSystem && COOLING_MAP[motorcycle.coolingSystem]) ||
    "Нет данных";
  const transmissionLabel =
    (motorcycle.transmission && TRANSMISSION_MAP[motorcycle.transmission]) ||
    "Нет данных";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${motorcycle.brand.name} ${motorcycle.model}`,
    url: productUrl,
    image: [imageUrl],
    description: `Технические характеристики ${motorcycle.model}: ${motorcycle.displacement} см³, ${motorcycle.power} л.с.`,
    sku: slug,
    mpn: slug,
    brand: {
      "@type": "Brand",
      name: motorcycle.brand.name,
    },
    category: motorcycle.category,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Год выпуска", value: motorcycle.year },
      {
        "@type": "PropertyValue",
        name: "Объем двигателя",
        value: `${motorcycle.displacement} см³`,
      },
      {
        "@type": "PropertyValue",
        name: "Мощность",
        value: `${motorcycle.power} л.с.`,
      },
      {
        "@type": "PropertyValue",
        name: "Максимальная скорость",
        value: `${motorcycle.topSpeed} км/ч`,
      },
      {
        "@type": "PropertyValue",
        name: "Расход топлива",
        value: `${motorcycle.fuelConsumption} л/100км`,
      },
      {
        "@type": "PropertyValue",
        name: "Тип двигателя",
        value: motorcycle.engineType,
      },
      {
        "@type": "PropertyValue",
        name: "Система охлаждения",
        value: coolingLabel,
      },
      {
        "@type": "PropertyValue",
        name: "Коробка передач",
        value: gearboxLabel,
      },
      { "@type": "PropertyValue", name: "Привод", value: transmissionLabel },
    ],
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "RUB",
      price: motorcycle.price,
      itemCondition: "https://schema.org",
      availability: "https://schema.org",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: motorcycle.rating,
      bestRating: "5",
      worstRating: "0",
      reviewCount: "10", // Хардкодим счетчик, пока нет такого функционала
    },
  };
};
