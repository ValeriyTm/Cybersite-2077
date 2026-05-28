import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useAdminMotorcycles = (page: number, debouncedSearch: string) => {
  return useQuery({
    queryKey: ["admin-motorcycles", page, debouncedSearch],
    queryFn: () =>
      $api
        .get("/admin/motorcycles", {
          params: {
            page,
            limit: 10,
            search: debouncedSearch,
          },
        })
        .then((res) => res.data),
    //Не делать запрос, если в поиске 1 символ:
    enabled: debouncedSearch.length === 0 || debouncedSearch.length >= 2,
  });
};
