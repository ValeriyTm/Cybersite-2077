import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useAdminBrands = (page: number) => {
  return useQuery({
    queryKey: ["admin-brands", page],
    queryFn: () =>
      $api.get(`/admin/brands?page=${page}`).then((res) => res.data),
  });
};
