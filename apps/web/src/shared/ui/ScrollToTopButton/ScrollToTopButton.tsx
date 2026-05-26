//Состояние:
import { useScrollToTop } from "@/shared/lib/hooks/useScrollToTop";
//Иконки:
import { FaArrowUp } from "react-icons/fa";
//Стили:
import styles from "./ScrollToTopButton.module.scss";

interface ScrollToTopButtonProps {
  /** Порог прокрутки в пикселях, после которого кнопка становится видимой (по умолчанию 400) */
  threshold?: number;
}

export const ScrollToTopButton = ({ threshold = 400 }: ScrollToTopButtonProps) => {
  // Подключаем наш переиспользуемый хук логики скролла
  const { showScroll, scrollToTop } = useScrollToTop(threshold);

  return (
    <button
      type="button"
      className={`${styles.scrollToTop} ${showScroll ? styles.visible : ''}`}
      onClick={scrollToTop}
      aria-label="Наверх страницы"
    >
      <FaArrowUp />
    </button>
  );
};
