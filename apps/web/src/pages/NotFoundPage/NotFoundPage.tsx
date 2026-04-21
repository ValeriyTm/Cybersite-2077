//Роутинг:
import { useNavigate } from "react-router";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./NotFoundPage.module.scss";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Ooops, not found</title>
      </Helmet>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <h1 className={styles.glitch} data-text="404">
            404
          </h1>
          <h2>Сигнал потерян</h2>
          <p>
            Похоже, этот путь ведет в тупик или страница была удалена из базы
            данных.
          </p>

          <div className={styles.actions}>
            <button
              onClick={() => navigate(-1)}
              className={styles.secondaryBtn}
            >
              Назад
            </button>
            <button onClick={() => navigate("/")} className={styles.primaryBtn}>
              На главную
            </button>
          </div>

          <img
            src="src/shared/assets/images/banners/For404.png"
            alt=""
            className={styles.img404}
          />

        </div>
      </div>
    </>
  );
};
