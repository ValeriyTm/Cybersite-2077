import { create } from "zustand";
import { $api } from "@/shared/api/api";

export const useOrderStore = create((set) => ({
  activeOrdersCount: 0,
  fetchActiveCount: async () => {
    const res = await $api.get("/orders/active-count");
    set({ activeOrdersCount: res.data.count });
  },
  resetOrders: () => set({ activeOrdersCount: 0 }),
}));
