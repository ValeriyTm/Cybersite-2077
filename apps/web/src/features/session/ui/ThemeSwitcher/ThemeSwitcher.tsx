import { useThemeStore } from "@/entities/session";
//Настройки:
import { THEME_CONFIG } from "./ThemeSwitcher.config";
//Стили:
import styles from "./ThemeSwitcher.module.scss";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className={styles.themeSwitcher}>
      {THEME_CONFIG.map((t) => (
        <button
          type="button"
          key={t.id}
          className={styles.themeWrapper}
          onClick={() => setTheme(t.id)}
          title={t.title}
        >
          <img
            src={t.img}
            alt={t.title}
            className={theme === t.id ? styles.active : styles.inactive}
            width="33"
            height="33"
          />
        </button>
      ))}
    </div>
  );
};
