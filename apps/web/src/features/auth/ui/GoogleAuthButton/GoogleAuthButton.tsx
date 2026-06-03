//Иконки:
import { FcGoogle } from 'react-icons/fc';
//Стили:
import styles from './GoogleAuthButton.module.scss'; // Укажите правильный путь к стилям

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
}

export const GoogleAuthButton = ({ mode = 'login' }: GoogleAuthButtonProps) => {
  return (
    <button
      className={styles.googleBtn}
      type="button"
      disabled
    >
      <FcGoogle className={styles.google} />
      <span title='Во избежание нарушения 152ФЗ'>
        {mode === "login" ? "Вход с Google недоступен" : "Регистрация с Google не доступна"}
      </span>
    </button>
  );
};


