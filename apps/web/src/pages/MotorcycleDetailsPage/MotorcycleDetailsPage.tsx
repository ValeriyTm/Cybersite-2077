import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { fetchMotorcycleBySlug, type MotorcycleFull } from "@/entities/catalog";
import styles from "./MotorcycleDetailsPage.module.scss";

const STATIC_URL = "http://localhost:3001/static/motorcycles";
const DEFAULT_IMG = `http://localhost:3001/static/defaults/default-card-icon.jpg`;

export const MotorcycleDetailsPage: React.FC = () => {
  const { brandSlug, slug } = useParams<{ brandSlug: string; slug: string }>();
  const [data, setData] = useState<MotorcycleFull | null>(null);
  //Стейт для активного фото:
  const [activeImage, setActiveImage] = useState<string>("");

  // useEffect(() => {
  //   if (brandSlug && slug) {
  //     fetchMotorcycleBySlug(brandSlug, slug).then((res) => {
  //       setData(res);
  //       setActiveImage(`${STATIC_URL}/motorcycles/${slug}.jpg`);
  //     });
  //   }
  // }, [brandSlug, slug]);

  useEffect(() => {
    if (brandSlug && slug) {
      fetchMotorcycleBySlug(brandSlug, slug).then((res) => {
        setData(res);
        // 🎯 Умная установка главного фото:
        // Если в базе есть помеченное как isMain — берем его, иначе первое из списка, иначе дефолт
        const mainImg =
          res.images?.find((img) => img.isMain)?.url || res.images?.[0]?.url;

        setActiveImage(mainImg ? `${STATIC_URL}/${mainImg}` : DEFAULT_IMG);
      });
    }
  }, [brandSlug, slug]);

  if (!data) return <div className={styles.loader}>Загрузка данных...</div>;

  return (
    <main className={styles.Page}>
      <div className={styles.container}>
        {/* 1. Секция Hero: Фото и главные параметры */}
        <section className={styles.hero}>
          <div className={styles.gallerySection}>
            <div className={styles.mainImageWrapper}>
              <img
                src={activeImage}
                alt={data.model}
                className={styles.mainImg}
              />
            </div>

            {/* Список миниатюр */}
            {data.images?.length > 0 && (
              <div className={styles.thumbnails}>
                {data.images.map((img) => (
                  <div
                    key={img.id}
                    className={`${styles.thumbWrapper} ${activeImage === `${STATIC_URL}/${img.url}` ? styles.activeThumb : ""}`}
                    onClick={() => setActiveImage(`${STATIC_URL}/${img.url}`)}
                  >
                    <img
                      src={`${STATIC_URL}/${img.url}`}
                      alt="thumb"
                      className={styles.thumbImg}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.mainInfo}>
            <h1 className={styles.title}>{data.model}</h1>
            <div className={styles.brandBadge}>{data.brand.name}</div>
            <div className={styles.price}>{data.price.toLocaleString()} ₽</div>
            <p className={styles.description}>
              {data.year} года выпуска, категория: {data.category}. Объем
              двигателя {data.displacement} см³.
            </p>
            <p className={styles.description}>Текущий рейтинг: {data.rating}</p>
          </div>
        </section>

        {/* 2. Таблица характеристик:*/}
        <section className={styles.specsSection}>
          <h2 className={styles.sectionTitle}>Технические характеристики</h2>
          <div className={styles.specsGrid}>
            {/*Характеристики:*/}
            <div className={styles.specRow}>
              <span>Тип двигателя:</span> <strong>{data.engineType}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Мощность:</span> <strong>{data.power} л.с.</strong>
            </div>
            <div className={styles.specRow}>
              <span>Максимальная скорость, км/ч:</span>{" "}
              <strong>{data.topSpeed}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Коробка передач:</span> <strong>{data.gearbox}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Стартер:</span> <strong>{data.starter}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Топливная система:</span> <strong>{data.fuelSystem}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Система охлаждения:</span>{" "}
              <strong>{data.coolingSystem}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Трансмиссия:</span> <strong>{data.transmission}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Заднее колесо:</span> <strong>{data.rearTyre}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Переднее колесо:</span> <strong>{data.frontTyre}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Задние тормоза:</span> <strong>{data.rearBrakes}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Передние тормоза:</span> <strong>{data.frontBrakes}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Расход топлива, л/100км:</span>{" "}
              <strong>{data.fuelConsumption}</strong>
            </div>
            <div className={styles.specRow}>
              <span>Дополнительная информация:</span>{" "}
              <strong>{data.comments}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
