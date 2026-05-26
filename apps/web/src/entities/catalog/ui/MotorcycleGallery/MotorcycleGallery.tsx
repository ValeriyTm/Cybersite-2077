import { useState } from "react";
import { API_URL } from "@/shared/api";
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg';
import styles from "./MotorcycleGallery.module.scss";

// Вынесли статическую константу наверх модуля
const STATIC_URL = `${API_URL}/static/motorcycles`;

interface MotorcycleImg {
  id: string;
  url: string;
  isMain: boolean;
}

interface MotorcycleGalleryProps {
  images?: MotorcycleImg[];
  model: string;
}

export const MotorcycleGallery = ({ images = [], model }: MotorcycleGalleryProps) => {
  //Стейт для выбранной миниатюры:
  const [clickedImgUrl, setClickedImgUrl] = useState<string | null>(null);

  //Ищем основное изображение или берем самое первое в массиве:
  const mainImg = images.find((img) => img.isMain)?.url || images[0]?.url;

  //Базовый URL - это либо склеенный путь к главной, либо дефолтная картинка:
  const basicUrl = mainImg ? `${STATIC_URL}/${mainImg}` : defaultMotoImage;

  // Текущее активное изображение для большого экрана
  const activeImage = clickedImgUrl || basicUrl;

  return (
    <div className={styles.gallerySection}>
      {/* Главное большое изображение */}
      <div className={styles.mainImageWrapper}>
        <img
          src={activeImage}
          alt={model}
          className={styles.mainImg}
          width="500"
          height="350"
        />
      </div>

      {/* Список интерактивных миниатюр */}
      {images.length > 0 && (
        <div className={styles.thumbnails}>
          {images.map((img) => {
            const currentThumbUrl = `${STATIC_URL}/${img.url}`;
            const isActive = activeImage === currentThumbUrl;

            return (
              <div
                key={img.id}
                className={`${styles.thumbWrapper} ${isActive ? styles.activeThumb : ""}`}
                onClick={() => setClickedImgUrl(currentThumbUrl)}
              >
                <img
                  src={currentThumbUrl}
                  alt={`${model} thumb`}
                  className={styles.thumbImg}
                  width="76"
                  height="56"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
