export const GlobalErrorFallback = () => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "sans-serif",
        padding: "20px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>💥</h1>
      <h2 style={{ marginBottom: "10px" }}>Критическая ошибка приложения</h2>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Произошло что-то непредвиденное. Мы уже работаем над исправлением.
      </p>
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Перезагрузить сайт
      </button>
    </div>
  );
};
