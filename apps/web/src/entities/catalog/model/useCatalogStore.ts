import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface CatalogState {
  // UI Состояния
  isSidebarOpen: boolean;
  viewMode: "grid" | "list";

  // Методы управления
  toggleSidebar: () => void;
  setViewMode: (mode: "grid" | "list") => void;

  // Мы НЕ храним здесь сами фильтры (они полетят в URL),
  // но можем хранить общее кол-во найденных моделей для заголовка
  totalItems: number;
  setTotalItems: (total: number) => void;
}

export const useCatalogStore = create<CatalogState>()(
  devtools((set) => ({
    isSidebarOpen: true,
    viewMode: "grid",
    totalItems: 0,

    toggleSidebar: () =>
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setViewMode: (mode) => set({ viewMode: mode }),
    setTotalItems: (total) => set({ totalItems: total }),
  })),
);
