import { useQuery } from "@tanstack/react-query";
//API
import { $api } from "@/shared/api";

export const useTickets = () => {
  return useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => $api.get("/support/my-tickets").then((res) => res.data),
  });
};
