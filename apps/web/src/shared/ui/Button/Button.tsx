import { Link } from "react-router";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
//Стили:
import styles from "./Button.module.scss";

//----------Полиморфный компонент: может быть и кнопкой, и ссылкой (в зависимости от переданных пропсов)---//

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "outline" | "outline-dark" | "simple" | "cancel" | "success" | "review" | 'parade';
  bold?: boolean;
}

type ButtonProps = BaseButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: string; //Превращает компонент в ссылку
  };

export const Button = ({
  children,
  isLoading,
  loadingText,
  variant = "primary",
  className,
  disabled,
  bold,
  to,
  ...props
}: ButtonProps) => {
  //Общая строка стилей для кнопки и для ссылки:
  const combinedClassName = `${styles.btn} ${styles[variant]} ${bold ? styles.bold : ''} ${className || ""}`;
  const isButtonDisabled = isLoading || disabled;

  //Если передан проп "to", рендерим компонент как ссылку <Link>
  if (to) {
    return (
      <Link
        to={isButtonDisabled ? "#" : to} // Блокируем переход, если кнопка в режиме загрузки или disabled
        className={`${combinedClassName} ${isButtonDisabled ? styles.disabledLink : ""}`}
        {...(props)}
      >
        {isLoading ? loadingText || "Загрузка..." : children}
      </Link>
    );
  }

  return (

    <button
      className={`${styles.btn} ${styles[variant]} ${bold ? styles.bold : ''} ${className || ""}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? loadingText || "Загрузка..." : children}
    </button>
  );
};
