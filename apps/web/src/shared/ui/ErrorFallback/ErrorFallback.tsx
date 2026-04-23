// //Этот компонент будет отображен, если произойдет ошибка внутри любого компонента внутри компонента App.
import { useEffect } from "react";
//Роутинг:
import { useRouteError, isRouteErrorResponse } from "react-router";
//Стили:
import styles from './ErrorFallback.module.scss';

export const ErrorFallback = () => {
  // Хук для получения ошибки из контекста роутера
  const error = useRouteError();

  useEffect(() => {
    console.error("Caught by React Router ErrorElement:", error);
  }, [error]);

  // Определяем текст ошибки в зависимости от её типа
  let errorMessage: string;

  if (isRouteErrorResponse(error)) {
    //Ошибки типа 404, 500 и т.д.
    errorMessage = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    //Обычные JS ошибки
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = "Неизвестная ошибка";
  }

  return (
    <div className={styles.errorCard}>
      <h2>Упс! Что-то пошло не так 😭</h2>
      <p>В приложении произошла техническая ошибка</p>
      <pre>{errorMessage}</pre>
      <button onClick={() => window.location.assign("/")}>На главную</button>
      <img className={styles.errorImg} src="src/shared/assets/images/banners/errorBanner.png" alt="Error image" width='1143' height='768' />
    </div>
  );
};
