//-------------------Состояние мобильного меню (от бургер-кнопки)---------------------//
import { create } from "zustand";

interface LayoutState {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isMenuOpen: false,
  toggleMenu: () => set((state: any) => ({ isMenuOpen: !state.isMenuOpen })),
  closeMenu: () => set({ isMenuOpen: false }),
}));
