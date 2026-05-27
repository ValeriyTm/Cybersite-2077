//Извлечение параметров из URL и роутинг:
import { Navigate, useParams } from "react-router";
//Состояния:
import { useMemo, useState } from "react";
import { useProfile } from "@/features/auth";
import { useMotorcycleBySlug, useRelatedMotos, useMotorcycleReviews } from "@/entities/catalog/lib";
//API:
import { API_URL } from "@/shared/api/api";
//Типы:
import type { MotorcycleFull } from "@repo/types";
//Компоненты:
import { Breadcrumbs } from "@/shared/ui";
import { MotorcycleGallery, type MotorcycleShort } from "@/entities/catalog";
import { MotorcycleCard } from "@/widgets/MotorcycleCard";
import { MotorcycleTabs } from "@/widgets/MotorcycleTabs";
import { MotorcycleInfoCard } from "@/widgets/MotorcycleInfoCard";
//SEO:
import { Helmet } from "react-helmet-async";
import { generateMotorcycleJsonLd } from "./utils";
//Изображения:
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg'
//Стили
import styles from "./MotorcycleDetailsPage.module.scss";


const STATIC_URL = `${API_URL}/static/motorcycles`;

export const MotorcycleDetailsPage = () => {
  //Извлекаем бренд и модель из адресной строки:
  const { brandSlug, slug } = useParams<{ brandSlug: string; slug: string }>();
  //Извлекаем данные юзера для работы с отзывом:
  const { user } = useProfile();

  //Получаем данные о мотоцикле:
  const { data, isLoading, isError } = useMotorcycleBySlug({ brandSlug, slug });
  const motorcycle = data as MotorcycleFull | undefined; //Типизируем 
  //------------------Изображения:----------------------//
  //Состояние для кликнутому изображению в галерее:
  const [clickedImgUrl] = useState<string | null>(null);

  //С сервера приходят данные вида: {..., images: MotorcycleImg[], ...}
  //Ищем основное изображение для мотоцикла среди всех его изображений:
  const mainImg = motorcycle?.images?.find((img) => img.isMain)?.url
    || motorcycle?.images?.[0]?.url;
  //Базовым изображением выбираем основное или дефолтное (если основного нет):
  const basicUrl = mainImg ? `${STATIC_URL}/${mainImg}` : defaultMotoImage;
  //Актуальное текущее изображение: 
  const activeImage = clickedImgUrl || basicUrl;

  //------------------------Рекоммендации:-------------//
  //Получаем данные по рекомендованным мотоциклам:
  const { data: relatedMotorcycles } = useRelatedMotos({ slug });

  //----------------------Отзывы:--------------------------//
  const {
    reviews, //Список отщывов
    deleteReview, //Функция удаления отзыва
  } = useMotorcycleReviews({
    motorcycleId: motorcycle?.id,
    slug
  });

  //Обработчик для удаления отзыва:
  const handleDelete = (reviewId: string) => {
    if (window.confirm("Удалить этот отзыв?")) {
      deleteReview(reviewId);
    }
  };

  //------------------------------Микроразметка:---------------------------//
  //Объект микроразметки JSON-LD:
  const jsonLd = useMemo(() => {
    if (!motorcycle) return null;

    return generateMotorcycleJsonLd(
      motorcycle,
      brandSlug,
      slug,
    );
  }, [motorcycle, brandSlug, slug]);
  //-------------------------------Проблемные случаи:-------------------//
  //Лоадер:
  if (isLoading)
    return <div className={styles.loader}>Загрузка...</div>;

  //Если произошла ошибка запроса:
  if (isError || !motorcycle) {
    return <Navigate to="/404" replace />;
  }
  //--------------------------------Breadcrumbs:--------------//
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog/" },
    { label: "Бренды", href: "/catalog/motorcycles" },
    {
      label: motorcycle.brand.name,
      href: `/catalog/motorcycles/${motorcycle.brand.slug}`,
    },
    { label: motorcycle.model }, // Текущая страница без ссылки
  ];

  //----------------------------------SEO:---------------------//
  //Формируем SEO-строки:
  const seoTitle = `${motorcycle.brand.name} ${motorcycle.model} ${motorcycle.year} г.в. — Характеристики и цены | CyberSite2077`;
  const seoDescription = `Подробные технические характеристики ${motorcycle.brand.name} ${motorcycle.model}: двигатель ${motorcycle.displacement} см³, мощность ${motorcycle.power} л.с. Цвета: ${motorcycle.colors?.join(", ")}. Узнайте всё о модели на CyberSite2077.`;
  const ogImage = activeImage || defaultMotoImage;
  const canonicalUrl = `${import.meta.env.VITE_SITE_URL}/catalog/motorcycles/${brandSlug}/${slug}`;

  return (
    <>
      {/* SEO: */}
      <Helmet>
        <title>{seoTitle}</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="description" content={seoDescription} />
        {/*Соцсети (Open Graph):*/}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="product" />

        {/*JSON-LD микроразметка:*/}
        {/* Рендерим скрипт только если jsonLd успешно рассчитан */}
        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>

      <main className={styles.Page}>
        <div className={styles.container}>
          {/*0) Breadcrumbs:*/}
          <Breadcrumbs items={breadcrumbs} />

          {/*1) Верхняя половина страницы: */}
          <section className={styles.hero}>
            {/* Фото и главные параметры (левый верх) */}
            <MotorcycleGallery images={motorcycle.images} model={motorcycle.model} />

            {/* Основные сведения о товаре (правый верх) */}
            <MotorcycleInfoCard motorcycle={motorcycle} />
          </section>

          {/*2) Центральная часть страницы: */}
          <MotorcycleTabs
            motorcycle={motorcycle}
            reviews={reviews}
            onDeleteReview={handleDelete}
            user={user}
          />

          {/*3) Рекоммендации:*/}
          {relatedMotorcycles?.length > 0 && (
            <section className={styles.relatedSection}>
              <h2 className={styles.sectionTitle}>Похожие модели</h2>
              <div className={styles.relatedGrid}>
                {relatedMotorcycles.map((moto: MotorcycleShort) => (
                  <MotorcycleCard key={moto.id} moto={moto} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};
