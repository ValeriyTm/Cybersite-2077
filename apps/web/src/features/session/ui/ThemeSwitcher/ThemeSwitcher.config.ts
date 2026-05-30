//Типы:
import type { ThemeType } from "@/entities/session/model/themeStore";
//Изображения:
import themeOrange from "@/shared/assets/images/theme/theme-icon1.png";
import themeBlue from "@/shared/assets/images/theme/theme-icon4.png";
import themeRetro from "@/shared/assets/images/theme/theme-icon2.png";
import themeDoom from "@/shared/assets/images/theme/theme-icon3.png";

interface ThemeConfigItem {
  id: ThemeType;
  title: string;
  img: string;
}

export const THEME_CONFIG: ThemeConfigItem[] = [
  { id: "theme-orange", img: themeOrange, title: "Тема Orange" },
  { id: "theme-blue", img: themeBlue, title: "Тема Blue" },
  { id: "theme-retrowave", img: themeRetro, title: "Тема Retrowave" },
  { id: "theme-doom", img: themeDoom, title: "Тема DOOM" },
];
