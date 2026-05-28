import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useAdminStocks = (motoId: string) => {
  return useQuery({
    queryKey: ["admin-stocks", motoId],
    queryFn: () =>
      $api.get("/admin/stocks", { params: { motoId } }).then((res) => res.data),
    enabled: !!motoId,
  });
};
