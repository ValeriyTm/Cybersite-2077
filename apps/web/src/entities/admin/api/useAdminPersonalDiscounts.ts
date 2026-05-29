import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useAdminPersonalDiscounts = (debouncedEmail: string) => {
  return useQuery({
    queryKey: ["admin-personal", debouncedEmail],
    queryFn: () =>
      $api
        .get("/admin/personal-discounts", {
          params: { email: debouncedEmail },
        })
        .then((res) => res.data),
  });
};
