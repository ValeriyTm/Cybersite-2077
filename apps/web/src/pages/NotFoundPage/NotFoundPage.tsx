//Роутинг:
import { useNavigate } from "react-router";
//SEO:
import { Helmet } from 'react-helmet-async';
//Изображения:
import notFoundBanner from '@/shared/assets/images/banners/For404.png';
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
            src={notFoundBanner}
            alt="404 Page image"
            className={styles.img404}
            width='922'
            height='614'
          />

        </div>
      </div>
    </>
  );
};
