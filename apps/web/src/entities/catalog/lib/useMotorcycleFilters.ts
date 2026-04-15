//------------Кастомный хук для работы с параметрами адресной строки в контексте фильтров:
import { useSearchParams } from "react-router";

export const useMotorcycleFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  //Извлекаем отдельные параметры из адресной строки:
  const filters = {
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 20,
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
    onlyInStock: searchParams.get("onlyInStock") === "true",
  };

  //Функция обновления URL:
  const updateFilters = (newValues: Record<string, any>) => {
    const params = new URLSearchParams(searchParams); //Берем все текущие GET-параметры из URL, чтобы не потерять те, которые мы сейчас не меняем

    Object.entries(newValues).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params.set(key, String(value));
        //Если значение фильтра передано (не пустое, не null, не undefined), оно добавляется в URL или перезаписывает старое через params.set
      } else {
        params.delete(key);
        //Если значение пустое (например, пользователь очистил поле поиска), параметр полностью удаляется из URL через params.delete
      }
    });

    //Если меняем любой фильтр, но при этом явно не указываем страницу, код принудительно поставит page=1:
    if (!newValues.page) params.set("page", "1");

    setSearchParams(params); //Обновляем URL
  };

  return { filters, updateFilters };
};
