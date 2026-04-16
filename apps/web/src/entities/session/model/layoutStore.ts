//-------------------Состояние мобильного меню (от бургер-кнопки)---------------------//
import { create } from "zustand";

export const useLayoutStore = create((set) => ({
  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  closeMenu: () => set({ isMenuOpen: false }),
}));
