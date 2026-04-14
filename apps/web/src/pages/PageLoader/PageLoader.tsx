import styles from "./PageLoader.module.scss";

export const PageLoader = () => {
    return (
        <div className={styles.loaderWrapper}>
            <div className={styles.spinner}></div>
            <span className={styles.text}>Инициирована загрузка данных...</span>
        </div>
    );
};
