// //Этот компонент будет отображен, если произойдет ошибка внутри любого компонента внутри компонента App.
import { useEffect } from "react";
import { useRouteError, isRouteErrorResponse } from "react-router";

export const ErrorFallback = () => {
  // Хук для получения ошибки из контекста роутера
  const error = useRouteError();

  useEffect(() => {
    console.error("Caught by React Router ErrorElement:", error);
  }, [error]);

  // Определяем текст ошибки в зависимости от её типа
  let errorMessage: string;

  if (isRouteErrorResponse(error)) {
    // Ошибки типа 404, 500 и т.д.
    errorMessage = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    // Обычные JS ошибки
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = "Неизвестная ошибка";
  }

  return (
    <div className="error-card">
      <h2>Упс! Что-то пошло не так 😭</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</pre>
      <button onClick={() => window.location.assign("/")}>На главную</button>
    </div>
  );
};
