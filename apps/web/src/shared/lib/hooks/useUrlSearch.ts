import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import debounce from "lodash/debounce";

export const useUrlSearch = (paramName = "search", delay = 500) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Получаем текущее значение строки поиска из URL
  const searchQuery = searchParams.get(paramName) || "";

  // Функция обновления URL
  const updateUrl = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams);

      if (val.trim()) {
        params.set(paramName, val.trim());
      } else {
        params.delete(paramName);
      }

      params.set("page", "1"); // При любом новом поиске всегда сбрасываем пагинацию на 1 страницу

      setSearchParams(params);
    },
    [searchParams, setSearchParams, paramName],
  );

  const debouncedSearch = useMemo(
    () => debounce((val: string) => updateUrl(val), delay),
    [updateUrl, delay],
  );

  return {
    searchQuery,
    debouncedSearch,
  };
};
