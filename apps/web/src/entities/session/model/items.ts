import logoOrange from "@/shared/assets/images/logos/logo-orange.png";
import logoBlue from "@/shared/assets/images/logos/logo-blue.png";
import logoRetro from "@/shared/assets/images/logos/logo-retro.png";
import logoDoom from "@/shared/assets/images/logos/logo-doom.png";

export const getLogoByTheme = (theme: string) => {
  switch (theme) {
    case "theme-blue":
      return logoBlue;
    case "theme-retrowave":
      return logoRetro;
    case "theme-doom":
      return logoDoom;
    case "theme-orange":
    default:
      return logoOrange;
  }
};
