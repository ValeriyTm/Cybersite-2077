import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";

export const useAdminTickets = (
  page: number,
  statusFilter: string,
  debouncedEmail: string,
) => {
  return useQuery({
    queryKey: ["admin-tickets", page, statusFilter, debouncedEmail],
    queryFn: () =>
      $api
        .get("/admin/tickets", {
          params: {
            page,
            limit: 10,
            status: statusFilter,
            email: debouncedEmail,
          },
        })
        .then((res) => res.data),
  });
};
