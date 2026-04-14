import styles from "./GlobalErrorFallback.module.scss";

export const GlobalErrorFallback = () => {
  return (
    <div className={styles.wrapper}>

      <div className={styles.glitchIcon}>⚠️</div>

      <h1 className={styles.title}>Системный сбой в виртуальном мире</h1>

      <p className={styles.description}>
        Произошла ошибка при загрузке ресурса. Приносим свои извинения 🥺
      </p>

      <button
        className={styles.refreshBtn}
        onClick={() => (window.location.href = "/")}
      >
        Вернуться на главную страницу
      </button>
    </div>
  );
};
