//Кастомный хук для работы с параметрами адресной строки в контексте фильтров:
import { useSearchParams } from "react-router";

export const useMotorcycleFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Читаем параметры из URL:
  const filters = {
    page: Number(searchParams.get("page")) || 1,
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "name_asc",
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    minYear: searchParams.get("minYear") || undefined,
    maxYear: searchParams.get("maxYear") || undefined,
    minDisplacement: searchParams.get("minDisplacement") || undefined,
    maxDisplacement: searchParams.get("maxDisplacement") || undefined,
    minPower: searchParams.get("minPower") || undefined,
    maxPower: searchParams.get("maxPower") || undefined,
    category: searchParams.get("category") || undefined,
    transmission: searchParams.get("transmission") || undefined,
    minRating: searchParams.get("minRating") || undefined,
  };

  // Функция обновления URL
  const updateFilters = (newValues: Record<string, any>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newValues).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    // Если обновляем не страницу — сбрасываем на 1-ю
    if (!newValues.page) params.set("page", "1");

    setSearchParams(params);
  };

  return { filters, updateFilters };
};
