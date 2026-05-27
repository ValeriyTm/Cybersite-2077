//Роутинг:
import { Link } from "react-router";
//Изображения:
import { myImages } from "./items";
//Стили:
import styles from "./ScrollableImageGallery.module.scss";

export const ScrollableImageGallery = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollContainer}>
        {myImages.map((img) => {
          const link = `/catalog/motorcycles/${img.slug}`;
          return (
            <div key={img.id} className={styles.item}>
              <Link to={link}>
                <img src={img.src} alt={img.alt || "gallery item"} width='300' height='200' />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
