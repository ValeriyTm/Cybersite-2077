import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Типы:
import type { Role } from "@repo/database/generated/prisma/client";

export const useAdminUsers = (role: Role | "", email: string) => {
  const ROLE = role.toLocaleUpperCase();

  return useQuery({
    queryKey: ["admin-users", role, email],
    queryFn: () =>
      $api
        .get("/admin/users", { params: { role: ROLE, email } })
        .then((res) => res.data),
  });
};
