//Иконки:
import { FcGoogle } from 'react-icons/fc';
//Стили:
import styles from './GoogleAuthButton.module.scss'; // Укажите правильный путь к стилям

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
  onClick: () => void;
}

export const GoogleAuthButton = ({ mode = 'login', onClick }: GoogleAuthButtonProps) => {
  return (
    <button
      className={styles.googleBtn}
      type="button"
      onClick={onClick}
    >
      <FcGoogle className={styles.google} />
      <span>
        {mode === "login" ? "Войти с Google" : "Зарегистрироваться с Google"}
      </span>
    </button>
  );
};


