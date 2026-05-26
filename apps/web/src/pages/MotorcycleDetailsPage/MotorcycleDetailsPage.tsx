//Извлечение параметров из URL и роутинг:
import { Navigate, useParams } from "react-router";
//Состояния:
import { useState } from "react";
import { useFavorites, useTradingStore } from "@/entities/trading";
import { useAuthStore, useProfile } from "@/features/auth";
import { useMotorcycleBySlug, useRelatedMotos, useMotorcycleReviews } from "@/entities/catalog/lib";
//API:
import { API_URL } from "@/shared/api/api";
//Типы:
import type { MotorcycleFull } from "@repo/types";
//SEO:
import { Helmet } from "react-helmet-async";
//Компоненты:
import { SpecRow, Breadcrumbs } from "@/shared/ui";
import { type MotorcycleReview, type MotorcycleShort } from "@/entities/catalog";
import { MotorcycleCard } from "@/widgets/MotorcycleCard";
import { AddToCartButton } from "@/features/trading";
import { ReviewCard } from "@/entities/reviews";
//Изображения:
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg'
//Стили
import styles from "./MotorcycleDetailsPage.module.scss";


const STATIC_URL = `${API_URL}/static/motorcycles`;

type TabType = "specs" | "description" | "warranty" | "docs" | "reviews";

export const MotorcycleDetailsPage = () => {
  //Извлекаем бренд и модель из адресной строки:
  const { brandSlug, slug } = useParams<{ brandSlug: string; slug: string }>();
  //Стейт для табов:
  const [activeTab, setActiveTab] = useState<TabType>("specs");
  //Данные о том, авторизован ли юзер:
  const isAuth = useAuthStore((state) => state.isAuth);
  //Извлекаем данные юзера для работы с отзывом:
  const { user } = useProfile();

  //Подключаем избранное и корзину:
  const { toggleFavorite } = useFavorites();
  const favoriteIds = useTradingStore((state) => state.favoriteIds);

  //Получаем данные о мотоцикле:
  const { data, isLoading, isError } = useMotorcycleBySlug({ brandSlug, slug });
  const motorcycle = data as MotorcycleFull | undefined; //Типизируем 
  //------------------Изображения:----------------------//
  //Состояние для кликнутому изображению в галерее:
  const [clickedImgUrl, setClickedImgUrl] = useState<string | null>(null);

  //С сервера приходят данные вида: {..., images: MotorcycleImg[], ...}

  //Ищем основное изображение для мотоцикла среди всех его изображений:
  const mainImg = motorcycle?.images?.find((img) => img.isMain)?.url
    || motorcycle?.images?.[0]?.url;
  //Базовым изображением выбираем основное или дефолтное (если основного нет):
  const basicUrl = mainImg ? `${STATIC_URL}/${mainImg}` : defaultMotoImage;

  //Актуальное текущее изображение: 
  const activeImage = clickedImgUrl || basicUrl;
  //----------------------------------------------------//

  //------------------------Рекоммендации:-------------//
  //Получаем данные по рекомендованным мотоциклам:
  const { data: relatedMotorcycles } = useRelatedMotos({ slug });
  //------------------------------------------------------//

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
  //------------------------------------------------------------//
  //Подключаем логику избранного

  //Проверяем, в избранном ли текущий байк (data?.id сработает корректно, когда данные подгрузятся):
  const isFavorite = motorcycle ? favoriteIds.includes(motorcycle.id) : false;

  const handleFavoriteClick = () => {
    if (!isAuth) {
      alert("Войдите для добавления в избранное");
      return;
    }
    if (motorcycle) toggleFavorite(motorcycle.id);
  };

  //--------------------Проблемные случаи:-------------------//
  //Лоадер:
  if (isLoading)
    return <div className={styles.loader}>Загрузка...</div>;

  //Если произошла ошибка запроса:
  if (isError || !motorcycle) {
    return <Navigate to="/404" replace />;
  }
  //----------------Breadcrumbs:------//
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
  const canonicalUrl = `${API_URL}/catalog/motorcycles/${brandSlug}/${slug}`;

  //Объект микроразметки JSON-LD:
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${motorcycle.brand.name} ${motorcycle.model}`,
    "url": `http://${import.meta.env.VITE_SITE_URL}/catalog/motorcycles/${brandSlug}/${slug}`,
    image: [`${API_URL}/static/motorcycles/${motorcycle.images?.find(img => img.isMain)?.url}`],
    description: `Технические характеристики ${motorcycle.model}: ${motorcycle.displacement} см³, ${motorcycle.power} л.с.`,
    "sku": slug, //Внутренний идентификатор товара в моём магазине
    "mpn": slug, //Идентификатор товара от производителя
    brand: {
      "@type": "Brand",
      name: motorcycle.brand.name,
    },
    "category": motorcycle.category,

    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Год выпуска",
        "value": motorcycle.year
      },
      {
        "@type": "PropertyValue",
        "name": "Объем двигателя",
        "value": `${motorcycle.displacement} см³`
      },
      {
        "@type": "PropertyValue",
        "name": "Мощность",
        "value": `${motorcycle.power} л.с.`
      },
      {
        "@type": "PropertyValue",
        "name": "Максимальная скорость",
        "value": `${motorcycle.topSpeed} км/ч`
      },
      {
        "@type": "PropertyValue",
        "name": "Расход топлива",
        "value": `${motorcycle.fuelConsumption} л/100км`
      },
      {
        "@type": "PropertyValue",
        "name": "Тип двигателя",
        "value": motorcycle.engineType
      },
      {
        "@type": "PropertyValue",
        "name": "Система охлаждения",
        "value": motorcycle.coolingSystem
      },
      {
        "@type": "PropertyValue",
        "name": "Коробка передач",
        "value": motorcycle.gearbox
      },
      {
        "@type": "PropertyValue",
        "name": "Привод",
        "value": motorcycle.transmission
      }
    ],
    offers: {
      "@type": "Offer",
      url: `http://${import.meta.env.VITE_SITE_URL}/catalog/motorcycles/${brandSlug}/${slug}`, //Ссылка на страницу, где можно купить товар
      priceCurrency: "RUB",
      price: motorcycle.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock", //Указываем, что в наличии
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: motorcycle.rating,
      "bestRating": "5",
      "worstRating": "0",
      reviewCount: "85", //Пока хардкодим число отзывов
    },
  };

  //-------------------Задаю понятные названия:-------------------
  const STARTER_MAP = {
    KICK: "Кикстартер",
    ELECTRIC: "Электростартер",
    ELECTRIC_KICK: "Электро- и кикстартер"
  };
  const STARTER = (motorcycle.starter && STARTER_MAP[motorcycle.starter]) ?? "Нет данных";

  const TRANSMISSION_MAP = {
    BELT: "Ременная передача",
    CHAIN: "Цепная передача",
    CARDAN: "Карданная передача"
  };
  const TRANSMISSION = (motorcycle.transmission && TRANSMISSION_MAP[motorcycle.transmission]) ?? "Нет данных";


  const COOLING_MAP = {
    LIQUID: "Жидкостное охлаждение",
    AIR: "Воздушное охлаждение",
    OIL_AIR: "Воздушное и жидкостное охлаждение"
  };
  const COOLING = (motorcycle.coolingSystem && COOLING_MAP[motorcycle.coolingSystem]) ?? "Нет данных";


  const GEARBOX_MAP = {
    SPEED1: "Одноступенчатая",
    SPEED2: "Двухступенчатая",
    SPEED2AUTOMATIC: "Двухступенчатая автоматическая",
    SPEED3: "Трехступенчатая",
    SPEED3AUTOMATIC: "Трехступенчатая автоматическая",
    SPEED4: "Четырехступенчатая",
    SPEED4WITHREVERSE: "Четырехступенчатая с задней передачей",
    SPEED5: "Пятиступенчатая",
    SPEED5WITHREVERSE: "Пятиступенчатая с задней передачей",
    SPEED6: "Шестиступенчатая",
    SPEED6WITHREVERSE: "Шестиступенчатая с задней передачей",
    SPEED7: "Семиступенчатая",
    SPEED8: "Восьмиступенчатая",
    AUTOMATIC: "Автоматическая"
  };
  const GEARBOX = (motorcycle.gearbox && GEARBOX_MAP[motorcycle.gearbox]) ?? "Нет данных";


  const CATEGORY_MAP = {
    ALLROUND: "Универсальный",
    ATV: "Квадроцикл",
    CLASSIC: "Классический",
    CROSS_MOTOCROSS: "Кросс/мотокросс",
    CUSTOM_CRUISER: "Кастом/круизер",
    ENDURO_OFFROAD: "Эндуро",
    MINIBIKE_CROSS: "Минибайк, кросс",
    MINIBIKE_SPORT: "Минибайк, спорт",
    NAKED_BIKE: "Нейкед (стрит)",
    PROTOTYPE_CONCEPT: "Прототип/концепт",
    SCOOTER: "Скутер",
    SPEEDWAY: "Трековый",
    SPORT: "Спортбайк",
    SPORT_TOURING: "Спорт-туринг",
    SUPER_MOTARD: "Супермото",
    TOURING: "Туристический",
    TRIAL: "Trial",
    UNSPECIFIED: "Не классифицировано"
  };
  const CATEGORY = CATEGORY_MAP[motorcycle.category];

  return (
    <>
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
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className={styles.Page}>
        <div className={styles.container}>
          {/*Breadcrumbs:*/}
          <Breadcrumbs items={breadcrumbs} />

          {/* Фото и главные параметры */}
          <section className={styles.hero}>
            <div className={styles.gallerySection}>
              <div className={styles.mainImageWrapper}>
                <img
                  src={activeImage}
                  alt={motorcycle.model}
                  className={styles.mainImg}
                  width='500'
                  height='350'
                />
              </div>

              {/* Список миниатюр */}
              {motorcycle.images?.length > 0 && (
                <div className={styles.thumbnails}>
                  {motorcycle.images.map((img) => {

                    return (
                      <div
                        key={img.id}
                        className={`${styles.thumbWrapper}`}
                        onClick={() => setClickedImgUrl(`${STATIC_URL}/${img.url}`)}
                      >
                        <img
                          src={`${STATIC_URL}/${img.url}`}
                          alt="thumb"
                          className={styles.thumbImg}
                          width='76'
                          height='56'
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={styles.mainInfo}>
              <h1 className={styles.title}>{motorcycle.model}</h1>
              <div className={styles.brandBadge}>{motorcycle.brand.name}</div>

              <div className={styles.actionRow}>
                {Number(motorcycle.discountData.discountPercent) > 0 ? (
                  <>
                    <div className={styles.oldPrice}>
                      {motorcycle.discountData.originalPrice.toLocaleString()} ₽
                    </div>{" "}
                    {motorcycle.discountData.isPersonal && (
                      <span className={styles.personalDiscount}>
                        Персональная скидка!
                      </span>
                    )}
                    <div className={styles.price}>
                      {motorcycle.discountData.finalPrice.toLocaleString()} ₽
                    </div>
                  </>
                ) : (
                  <div className={styles.price}>
                    {motorcycle.price.toLocaleString()} ₽
                  </div>
                )}

                {motorcycle.totalInStock ? (
                  <p>Количество единиц в наличии: {motorcycle.totalInStock}</p>
                ) : (
                  <p>Нет в наличии</p>
                )}

                <div className={styles.buttons}>
                  <AddToCartButton
                    data={{
                      id: motorcycle.id,
                      model: motorcycle.model,
                      price: motorcycle.price,
                      image: mainImg || '',
                      brandSlug: motorcycle.brand.slug,
                      slug: motorcycle.slug,
                      totalInStock: motorcycle.totalInStock,
                      year: motorcycle.year,
                    }}
                  />

                  {/*Кнопка добавления в избранное*/}
                  <button
                    className={`${styles.favBtn} ${isFavorite ? styles.active : ""}`}
                    onClick={handleFavoriteClick}
                    title={
                      isFavorite
                        ? "Удалить из избранного"
                        : "Добавить в избранное"
                    }
                  >
                    {isFavorite ? "❤️ В избранном" : "🤍 В избранное"}
                  </button>
                </div>
              </div>

              <p className={styles.description}>
                {motorcycle.year} года выпуска. Объем двигателя{" "}
                {motorcycle.displacement} см³.
              </p>
              <p className={styles.description}>Текущий рейтинг: {Number(motorcycle.rating.toFixed(1))}</p>
              <p className={styles.description}>
                Артикул товара: {motorcycle.slug}
              </p>
            </div>
          </section>

          {/* Таблица характеристик:*/}
          <nav className={styles.tabsNav} role='tablist'>
            <button
              className={activeTab === "specs" ? styles.activeTab : ""}
              onClick={() => setActiveTab("specs")}
              role='tab'
              aria-selected={activeTab === "specs"}
              tabIndex={activeTab === "specs" ? 0 : -1}
              aria-controls="specs-panel"
              id="specs-tab"
            >
              Технические характеристики
            </button>
            <button
              className={activeTab === "description" ? styles.activeTab : ""}
              onClick={() => setActiveTab("description")}
              role='tab'
              aria-selected={activeTab === "description"}
              tabIndex={activeTab === "description" ? 0 : -1}
              aria-controls="description-panel"
              id="description-tab"
            >
              Описание
            </button>
            <button
              className={activeTab === "reviews" ? styles.activeTab : ""}
              onClick={() => setActiveTab("reviews")}
              role='tab'
              aria-selected={activeTab === "reviews"}
              tabIndex={activeTab === "reviews" ? 0 : -1}
              aria-controls="reviews-panel"
              id="reviews-tab"
            >
              Отзывы
            </button>
            <button
              className={activeTab === "warranty" ? styles.activeTab : ""}
              onClick={() => setActiveTab("warranty")}
              role='tab'
              aria-selected={activeTab === "warranty"}
              tabIndex={activeTab === "warranty" ? 0 : -1}
              aria-controls="warranty-panel"
              id="warranty-tab"
            >
              Гарантия
            </button>
            <button
              className={activeTab === "docs" ? styles.activeTab : ""}
              onClick={() => setActiveTab("docs")}
              role='tab'
              aria-selected={activeTab === "docs"}
              tabIndex={activeTab === "docs" ? 0 : -1}
              aria-controls="docs-panel"
              id="docs-tab"
            >
              Документы
            </button>
          </nav>


          <section className={styles.tabContent}>
            {/*Контент характеристик:*/}
            {activeTab === "specs" && (
              <div className={styles.specsGrid} role="tabpanel">
                <SpecRow label="Категория" value={CATEGORY} />
                <SpecRow label="Тип двигателя" value={motorcycle.engineType} />
                <SpecRow label="Мощность" value={motorcycle.power} />
                <SpecRow
                  label="Максимальная скорость, км/ч"
                  value={motorcycle.topSpeed}
                />
                <SpecRow label="Коробка передач" value={GEARBOX} />
                <SpecRow label="Стартер" value={STARTER} />
                <SpecRow
                  label="Топливная система"
                  value={motorcycle.fuelSystem}
                />
                <SpecRow label="Система охлаждения" value={COOLING} />
                <SpecRow label="Трансмиссия" value={TRANSMISSION} />
                <SpecRow label="Заднее колесо" value={motorcycle.rearTyre} />
                <SpecRow label="Переднее колесо" value={motorcycle.frontTyre} />
                <SpecRow label="Задние тормоза" value={motorcycle.rearBrakes} />
                <SpecRow
                  label="Передние тормоза"
                  value={motorcycle.frontBrakes}
                />
                <SpecRow
                  label="Расход топлива, л/100км"
                  value={motorcycle.fuelConsumption}
                />
                <SpecRow
                  label="Дополнительная информация"
                  value={motorcycle.comments}
                />
                {/*Поле с цветами:*/}
                <div className={styles.specRow}>
                  <span>Доступные цвета</span>
                  <div className={styles.colorsWrapper}>
                    {motorcycle.colors && motorcycle.colors.length > 0 ? (
                      motorcycle.colors.map((color: string, index: number) => {
                        return (
                          <div key={index} className={styles.colorItem}>
                            {/* Кружок с цветом:*/}
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: color.toLowerCase() }}
                              title={color}
                            />
                            {/* Название цвета */}
                            <strong>{color}</strong>
                          </div>
                        )
                      })
                    ) : (
                      <strong>Не указано</strong>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/*Контент описания:*/}
            {activeTab === "description" && (
              <div className={styles.staticText} role="tabpanel">
                <h3>О модели {motorcycle.model}:</h3>
                <p>
                  Эта модель создана для тех, кто не привык искать компромиссы
                  между стилем и производительностью.
                </p>
                <p>
                  Этот мотоцикл сочетает в себе передовые технологии своего
                  времени. Сочетание выверенной эргономики и инженерных решений
                  делает каждый выезд предсказуемым и захватывающим.
                </p>
                <p>Основные преимущества:</p>
                <ul>
                  <li>
                    <strong>Надежность:</strong> каждая деталь спроектирована с
                    учетом высоких нагрузок и длительной эксплуатации.
                  </li>
                  <li>
                    <strong>Комфорт:</strong> посадка снижает усталость райдера
                    при длительных поездках.
                  </li>
                  <li>
                    <strong>Эстетика:</strong> дизайн, который притягивает взгляды
                    и подчеркивает индивидуальность владельца.
                  </li>
                </ul>
                <p>
                  Все модели проходят строгий контроль качества перед поступлением
                  в продажу.
                </p>
              </div>
            )}

            {/*Контент гарантии:*/}
            {activeTab === "warranty" && (
              <div className={styles.staticText} role="tabpanel">
                <h3>Гарантийные обязательства</h3>
                <p>
                  Стандартные условия гарантии на основной ассортимент мототехники
                  устанавливают гарантийный срок эксплуатации 30 (тридцать)
                  календарных дней с момента продажи или 20 (двадцать) моточасов
                  для техники, оборудованной счётчиком моточасов, в зависимости от
                  того, какое из указанных событий наступит раньше. Для ряда
                  моделей и брендов действуют отдельные условия гарантии.
                </p>
                <p>
                  Обслуживание производится в авторизованных сервисных центрах по
                  всей стране.
                </p>
                <p>
                  Для осуществления гарантийного обслуживания при розничной
                  покупке техники в салоне-магазине Покупателю надо прибыть с
                  СЕРВИСНОЙ КНИЖКОЙ (РУКОВОДСТВОМ ПО ЭКСПЛУАТАЦИИ), с транспортным
                  средством (ТС) к Продавцу, либо в авторизованный сервисный
                  центр, уполномоченный выполнять гарантийное обслуживание
                  приобретенного ТС. Рекомендуется предварительно согласовать с
                  представителем Продавца вопросы по гарантийному обслуживанию
                  (ремонту, замене)
                </p>
                <p>
                  Для осуществления гарантийного обслуживания при покупке через
                  интернет-магазин Покупателю надо представить:
                </p>
                <ul>
                  <li>
                    правильно и без помарок и исправлений заполненный ГАРАНТИЙНЫЙ
                    ТАЛОН, в котором должны быть указаны модель и серийный номер
                    изделия, дата продажи и печать торгующей организации;
                  </li>
                  <li>документ, подтверждающий покупку (товарная накладная);</li>
                  <li>товар в полной комплектации;</li>
                  <li>
                    экземпляр Договора купли-продажи, подписанный сторонами,
                    аналогичный экземпляру Договора купли-продажи, находящемуся у
                    Продавца.
                  </li>
                </ul>
                <p>
                  Обращаем также Ваше внимание на то, что при получении и оплате
                  заказа покупатель в присутствии курьера обязан проверить
                  комплектацию и внешний вид изделия на предмет отсутствия
                  физических дефектов (царапин, трещин, сколов и т.п.) и полноту
                  комплектации. После отъезда курьера, либо доставки транспортной
                  компанией, претензии по этим вопросам не принимаются.
                </p>
              </div>
            )}

            {/*Контент с документацией:*/}
            {activeTab === "docs" && (
              <div className={styles.docsSection} role="tabpanel">
                <h3>Документация</h3>
                <p style={{ textAlign: "center" }}>
                  Вы можете скачать полное руководство пользователя и сервисную
                  книжку:
                </p>
                <a
                  href={`${API_URL}/static/docs/manual.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.downloadBtn}
                >
                  📄 Скачать Manual.pdf (2.4 MB)
                </a>
              </div>
            )}

            {/*Контент с отзывами:*/}
            {activeTab === "reviews" && (
              <div className={styles.reviewsTab} role="tabpanel">
                {reviews?.length > 0 ? (
                  reviews.map((review: MotorcycleReview) => {
                    return (
                      <ReviewCard
                        key={review._id}
                        review={review}
                        onDelete={() => handleDelete(review._id)}
                        currentUserId={user?.id}
                        isAdmin={user?.role === "ADMIN"}
                      />
                    )
                  })
                ) : (
                  <div className={styles.noReviews}>
                    <p>На эту модель пока нет отзывов. Станьте первым!</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/*Рекомендации:*/}
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
