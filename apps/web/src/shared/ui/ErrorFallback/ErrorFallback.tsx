//Этот компонент будет отображен, если произойдет ошибка внутри любого компонента внутри компонента App.

export const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="error-card">
    <h2>Упс! Что-то пошло не так 😭</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Попробовать снова</button>
  </div>
);
