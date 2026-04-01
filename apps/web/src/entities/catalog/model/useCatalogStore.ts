import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Тип для режима отображения
export type ViewMode = "grid" | "list";

interface CatalogState {
  //Состояние отображения (сетка или список):
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  //Общее количество найденных моделей (для заголовков и статистики):
  totalItems: number;
  setTotalItems: (total: number) => void;

  //Состояние боковой панели фильтров (скрыта/показана):
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useCatalogStore = create<CatalogState>()(
  devtools(
    persist(
      (set) => ({
        //Начальные значения:
        viewMode: "grid",
        totalItems: 0,
        isSidebarOpen: true,

        //Экшены:
        setViewMode: (mode) => set({ viewMode: mode }),

        setTotalItems: (total) => set({ totalItems: total }),

        toggleSidebar: () =>
          set((state) => ({
            isSidebarOpen: !state.isSidebarOpen,
          })),
      }),
      {
        // Браузер запомнит, что пользователь выбрал "Список", и при следующем заходе на сайт сразу включит этот режим:
        name: "catalog-storage",
        partialize: (state) => ({ viewMode: state.viewMode }), //Сохраняем только режим вида
      },
    ),
  ),
);
