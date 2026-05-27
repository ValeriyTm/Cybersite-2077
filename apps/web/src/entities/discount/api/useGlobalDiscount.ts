import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useGlobalDiscount = () => {
  return useQuery({
    queryKey: ["global-discount"],
    queryFn: () => $api.get("/discount/global").then((res) => res.data),
  });
};
