import type { ButtonHTMLAttributes, ReactNode } from "react";
//Стили:
import styles from "./Button.module.scss";

//Типизируем пропсы:
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "outline" | "outline-dark";
  bold?: boolean;
}

export const Button = ({
  children,
  isLoading,
  loadingText,
  variant = "primary",
  className,
  disabled,
  bold,
  ...props
}: ButtonProps) => {
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
