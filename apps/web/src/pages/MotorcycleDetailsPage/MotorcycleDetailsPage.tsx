//Извлечение параметров из URL:
import { useParams } from "react-router";
import {
  fetchMotorcycleBySlug,
  type MotorcycleFull,
} from "@/entities/catalog";
//Типы:
import { type MotorcycleShort } from "@/entities/catalog/model/types";
//Состояния:
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/entities/trading/api/useCart";
import { useTradingStore } from "@/entities/trading/model/tradingStore";
import { useFavorites } from "@/entities/trading/api/useFavorites";
import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { useProfile } from "@/features/auth/model/useProfile";
//API:
import { $api, API_URL } from "@/shared/api/api";
//SEO:
import { Helmet } from "react-helmet-async";
//Компоненты:
import { SpecRow } from "@/shared/ui/SpecRow";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { MotorcycleCard } from "@/entities/catalog";
import { AddToCartButton } from "@/features/trading/ui/AddToCartButton/AddToCartButton";
import { ReviewCard } from "@/entities/reviews/ui/ReviewCard/ReviewCard";
//Стили
import styles from "./MotorcycleDetailsPage.module.scss";

const STATIC_URL = `${API_URL}/static/motorcycles`;
const DEFAULT_IMG = '/images/default-card-icon.jpg';

type TabType = "specs" | "description" | "warranty" | "docs" | "reviews";

export const MotorcycleDetailsPage = () => {
  //Извлекаем бренд и модель из адресной строки:
  const { brandSlug, slug } = useParams<{ brandSlug: string; slug: string }>();

  // const [data, setData] = useState<MotorcycleFull | null>(null);
  //Стейт для активного фото:
  const [activeImage, setActiveImage] = useState<string>("");
  //Стейт для рекомендаций:
  const [related, setRelated] = useState<MotorcycleShort[]>([]);
  //Стейт для табов:
  const [activeTab, setActiveTab] = useState<TabType>("specs");
  //Данные о том, авторизован ли юзер:
  const isAuth = useAuthStore((state) => state.isAuth);
  //Извлекаем данные юзера для работы с отзывом:
  const { user } = useProfile();

  const queryClient = useQueryClient();

  //Подключаем избранное и корзину
  const { toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const favoriteIds = useTradingStore((state) => state.favoriteIds);

  //Получаем данные по мотоциклу от сервера:
  const { data: motorcycle, isLoading: isMotoLoading } = useQuery({
    queryKey: ["motorcycle", slug],
    queryFn: () =>
      $api
        .get(`catalog/motorcycles/${brandSlug?.toLowerCase()}/${slug}`)
        .then((res) => res.data),
  });

  //Получаем данные по рекомендованным мотоциклам:
  const { data: relatedMotorcycles = [] } = useQuery({
    queryKey: ["related", slug],
    queryFn: () =>
      $api.get(`catalog/motorcycles/${slug}/related`).then((res) => res.data),
  });

  //Загружаем отзывы из MongoDB:
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["reviews", motorcycle?.id], // Ключ обновится, когда придет id
    queryFn: () =>
      $api.get(`/reviews/${motorcycle.id}`).then((res) => res.data),
    //Запрос не уйдет, пока motorcycle.id равен undefined:
    enabled: !!motorcycle?.id,
  });

  //Для работы с изображениями:
  useEffect(() => {
    if (motorcycle) {
      const mainImg =
        motorcycle.images?.find((img: any) => img.isMain)?.url ||
        motorcycle.images?.[0]?.url;
      setActiveImage(mainImg ? `${STATIC_URL}/${mainImg}` : '/images/default-card-icon.jpg');
    }
  }, [motorcycle]);

  //Мутация удаления отзыва
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => $api.delete(`/reviews/${reviewId}`),
    onSuccess: () => {
      //Обновляем список отзывов:
      queryClient.invalidateQueries({ queryKey: ["reviews", motorcycle?.id] });

      //Обновляем данные самого мотоцикла (чтобы звезды в шапке изменились):
      //(используем slug, так как это ключ первого запроса)
      queryClient.invalidateQueries({ queryKey: ["motorcycle", slug] });
    },
  });

  //-------
  //Для удаления отзыва:
  const handleDelete = (reviewId: string) => {
    if (window.confirm("Удалить этот отзыв?")) {
      deleteMutation.mutate(reviewId);
    }
  };
  //-----
  // 1. Подключаем логику избранного

  //Проверяем, в избранном ли текущий байк (data?.id сработает корректно, когда данные подгрузятся):
  const isFavorite = motorcycle ? favoriteIds.includes(motorcycle.id) : false;

  const handleFavoriteClick = () => {
    if (!isAuth) {
      alert("Войдите для добавления в избранное");
      return;
    }
    if (motorcycle) toggleFavorite(motorcycle.id);
  };

  ///--------------

  if (isMotoLoading || !motorcycle)
    return <div className={styles.loader}>Загрузка...</div>;
  //----------------Breadcrumbs:
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog/motorcycles" },
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
  const ogImage = activeImage || `/images/default-card-icon.jpg`;
  const canonicalUrl = `${API_URL}/catalog/motorcycles/${brandSlug}/${slug}`;

  //Объект микроразметки JSON-LD:
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${motorcycle.brand.name} ${motorcycle.model}`,
    "url": `http://localhost/catalog/motorcycles/${brandSlug}/${slug}`,
    image: [`${API_URL}/static/motorcycles/${motorcycle.mainImage}`],
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
      url: `http://localhost/catalog/motorcycles/${brandSlug}/${slug}`, //Ссылка на страницу, где можно купить товар
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
  let STARTER;
  switch (motorcycle.starter) {
    case "KICK":
      STARTER = "Кикстартер";
      break;
    case "ELECTRIC":
      STARTER = "Электростартер";
      break;
    case "ELECTRIC_KICK":
      STARTER = "Электро- и кикстартер";
  }

  let TRANSMISSION;
  switch (motorcycle.transmission) {
    case "BELT":
      TRANSMISSION = "Ременная передача";
      break;
    case "CHAIN":
      TRANSMISSION = "Цепная передача";
      break;
    case "CARDAN":
      TRANSMISSION = "Карданная передача";
  }

  let COOLING;
  switch (motorcycle.coolingSystem) {
    case "OIL":
      COOLING = "Жидкостное охлаждение";
      break;
    case "AIR":
      COOLING = "Воздушное охлаждение";
      break;
    case "OIL_AIR":
      COOLING = "Воздушное и жидкостное охлаждение";
  }

  let GEARBOX;
  switch (motorcycle.gearbox) {
    case "SPEED1":
      GEARBOX = "Одноступенчатая";
      break;
    case "SPEED2":
      GEARBOX = "Двухступенчатая";
      break;
    case "SPEED2AUTOMATIC":
      GEARBOX = "Двухступенчатая автоматическая";
      break;
    case "SPEED3":
      GEARBOX = "Трехступенчатая";
      break;
    case "SPEED3AUTOMATIC":
      GEARBOX = "Трехступенчатая автоматическая";
      break;
    case "SPEED4":
      GEARBOX = "Четырехступенчатая";
      break;
    case "SPEED4WITHREVERSE":
      GEARBOX = "Четырехступенчатая с задней передачей";
      break;
    case "SPEED5":
      GEARBOX = "Пятиступенчатая";
      break;
    case "SPEED5WITHREVERSE":
      GEARBOX = "Пятиступенчатая с задней передачей";
      break;
    case "SPEED6":
      GEARBOX = "Шестиступенчатая";
      break;
    case "SPEED6WITHREVERSE":
      GEARBOX = "Шестиступенчатая с задней передачей";
      break;
    case "SPEED7":
      GEARBOX = "Семиступенчатая";
      break;
    case "SPEED8":
      GEARBOX = "Восьмиступенчатая";
      break;
    case "AUTOMATIC":
      GEARBOX = "Автоматическая";
      break;
  }

  let CATEGORY;
  switch (motorcycle.category) {
    case "ALLROUND":
      CATEGORY = "Универсальный";
      break;
    case "ATV":
      CATEGORY = "Квадроцикл";
      break;
    case "CLASSIC":
      CATEGORY = "Классический";
      break;
    case "CROSS_MOTOCROSS":
      CATEGORY = "Кросс/мотокросс";
      break;
    case "CUSTOM_CRUISER":
      CATEGORY = "Кастом/круизер";
      break;
    case "ENDURO_OFFROAD":
      CATEGORY = "Эндуро";
      break;
    case "MINIBIKE_CROSS":
      CATEGORY = "Минибайк, кросс";
      break;
    case "MINIBIKE_SPORT":
      CATEGORY = "Минибайк, спорт";
      break;
    case "NAKED_BIKE":
      CATEGORY = "Нейкед (стрит)";
      break;
    case "PROTOTYPE_CONCEPT":
      CATEGORY = "Прототип/концепт";
      break;
    case "SCOOTER":
      CATEGORY = "Скутер";
      break;
    case "SPEEDWAY":
      CATEGORY = "Трековый";
      break;
    case "SPORT":
      CATEGORY = "Спортбайк";
      break;
    case "SPORT_TOURING":
      CATEGORY = "Спорт-туринг";
      break;
    case "SUPER_MOTARD":
      CATEGORY = "Супермото";
      break;
    case "TOURING":
      CATEGORY = "Туристический";
      break;
    case "TRIAL":
      CATEGORY = "Trial";
      break;
    case "UNSPECIFIED":
      CATEGORY = "Не классифицировано";
      break;
  }

  const mainImageUrl =
    motorcycle.images?.find((img) => img.isMain)?.url ||
    motorcycle.images?.[0]?.url ||
    ""; // Заглушка, если картинок нет вообще

  const realRating = Number(motorcycle.rating.toFixed(1));

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
                />
              </div>

              {/* Список миниатюр */}
              {motorcycle.images?.length > 0 && (
                <div className={styles.thumbnails}>
                  {motorcycle.images.map((img) => (
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
              <h1 className={styles.title}>{motorcycle.model}</h1>
              <div className={styles.brandBadge}>{motorcycle.brand.name}</div>

              <div className={styles.actionRow}>
                {motorcycle.discountData.discountPercent > 0 ? (
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
                      image: mainImageUrl,
                      brandSlug: motorcycle.brand.slug,
                      slug: motorcycle.slug,
                      totalInStock: motorcycle.totalInStock,
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
              <p className={styles.description}>Текущий рейтинг: {realRating}</p>
              <p className={styles.description}>
                Артикул товара: {motorcycle.slug}
              </p>
            </div>
          </section>

          {/* Таблица характеристик:*/}

          {/* Navbar для табов: */}
          <nav className={styles.tabsNav}>
            <button
              className={activeTab === "specs" ? styles.activeTab : ""}
              onClick={() => setActiveTab("specs")}
            >
              Технические характеристики
            </button>
            <button
              className={activeTab === "description" ? styles.activeTab : ""}
              onClick={() => setActiveTab("description")}
            >
              Описание
            </button>
            <button
              className={activeTab === "reviews" ? styles.activeTab : ""}
              onClick={() => setActiveTab("reviews")}
            >
              Отзывы
            </button>
            <button
              className={activeTab === "warranty" ? styles.activeTab : ""}
              onClick={() => setActiveTab("warranty")}
            >
              Гарантия
            </button>
            <button
              className={activeTab === "docs" ? styles.activeTab : ""}
              onClick={() => setActiveTab("docs")}
            >
              Документы
            </button>
          </nav>

          {/* Контент: */}
          <section className={styles.tabContent}>
            {/*Контент характеристик:*/}
            {activeTab === "specs" && (
              <div className={styles.specsGrid}>
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
                      motorcycle.colors.map((color, index) => (
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
                      ))
                    ) : (
                      <strong>Не указано</strong>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/*Контент описания:*/}
            {activeTab === "description" && (
              <div className={styles.staticText}>
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
              <div className={styles.staticText}>
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
              <div className={styles.docsSection}>
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
              <div className={styles.reviewsTab}>
                {reviews?.length > 0 ? (
                  reviews.map((review: any) => (
                    <ReviewCard
                      key={review._id}
                      review={review}
                      onDelete={() => handleDelete(review._id)}
                      currentUserId={user?.id}
                      isAdmin={user?.role === "ADMIN"}
                    />
                  ))
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
                {relatedMotorcycles.map((moto) => (
                  <MotorcycleCard key={moto.id} data={moto} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};
