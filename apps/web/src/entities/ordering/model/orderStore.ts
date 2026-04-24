////------------------Хранилище данных о количестве активных заказов (для отображения в Header)-------------////
import { create } from "zustand";
//API:
import { $api } from "@/shared/api";

interface OrderState {
  activeOrdersCount: number;
  fetchActiveCount: () => Promise<void>;
  resetOrders: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrdersCount: 0, //Счетчик активных заказов на фронте
  fetchActiveCount: async () => {
    const res = await $api.get("/orders/active-count");
    set({ activeOrdersCount: res.data.count });
  }, //Получаем кол-во активных заказов с сервера
  resetOrders: () => set({ activeOrdersCount: 0 }), //Обнуляем счетчик активных заказов на фронте
}));
