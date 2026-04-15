import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeType =
  | "theme-orange"
  | "theme-blue"
  | "theme-retrowave"
  | "theme-doom";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "theme-orange",
      setTheme: (theme) => {
        // Убираем старые классы и добавляем новый на body
        document.body.classList.remove(
          "theme-orange",
          "theme-blue",
          "theme-retrowave",
          "theme-doom",
        );
        document.body.classList.add(theme);
        set({ theme });
      },
    }),
    { name: "cyber-theme" },
  ),
);
