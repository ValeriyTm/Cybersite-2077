import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useAdminPromos = () => {
  return useQuery({
    queryKey: ["admin-promos"],
    queryFn: () => $api.get("/admin/promos").then((res) => res.data),
  });
};
