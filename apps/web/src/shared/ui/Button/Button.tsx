import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

//Типизируем пропсы:
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "outline";
}

export const Button = ({
  children,
  isLoading,
  loadingText,
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${className || ""}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? loadingText || "Загрузка..." : children}
    </button>
  );
};
