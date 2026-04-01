import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  fetchMotorcycleBySlug,
  fetchRelatedMotorcycles,
  type MotorcycleFull,
} from "@/entities/catalog";
import { SpecRow } from "@/shared/ui/SpecRow";
import { MotorcycleCard } from "@/entities/catalog";
import { type MotorcycleShort } from "@/entities/catalog/model/types";
//Для SEO:
import { Helmet } from "react-helmet-async";
//Компонент Breadcrumbs:
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
//Состояние:
import { useCart } from "@/entities/trading/api/useCart";
//Стили
import styles from "./MotorcycleDetailsPage.module.scss";

const STATIC_URL = "http://localhost:3001/static/motorcycles";
const DEFAULT_IMG = `http://localhost:3001/static/defaults/default-card-icon.jpg`;

type TabType = "specs" | "description" | "warranty" | "docs";

export const MotorcycleDetailsPage = () => {
  const { brandSlug, slug } = useParams<{ brandSlug: string; slug: string }>();
  const [data, setData] = useState<MotorcycleFull | null>(null);
  //Стейт для активного фото:
  const [activeImage, setActiveImage] = useState<string>("");
  //Стейт для рекомендаций:
  const [related, setRelated] = useState<MotorcycleShort[]>([]);
  //Стейт для табов:
  const [activeTab, setActiveTab] = useState<TabType>("specs");

  useEffect(() => {
    if (brandSlug && slug) {
      fetchMotorcycleBySlug(brandSlug, slug).then((res) => {
        setData(res);
        //Если в БД есть изображение с флагом isMain — берем его, иначе первое из списка (если вообще ничего нет - ставим дефолт)
        const mainImg =
          res.images?.find((img) => img.isMain)?.url || res.images?.[0]?.url;

        setActiveImage(mainImg ? `${STATIC_URL}/${mainImg}` : DEFAULT_IMG);
      });
    }
  }, [brandSlug, slug]);

  useEffect(() => {
    if (slug) {
      //Очищаем старые рекомендации перед загрузкой новых:
      setRelated([]);

      //Загружаем новые:
      fetchRelatedMotorcycles(slug)
        .then(setRelated)
        .catch((err) => console.error("Ошибка загрузки рекомендаций:", err));
    }
  }, [slug]);

  const { addToCart } = useCart();

  if (!data) return <div className={styles.loader}>Загрузка данных...</div>;

  //Формируем SEO-строки:
  const seoTitle = `${data.brand.name} ${data.model} ${data.year} г.в. — Характеристики и цены | CyberSite2077`;
  const seoDescription = `Подробные технические характеристики ${data.brand.name} ${data.model}: двигатель ${data.displacement} см³, мощность ${data.power} л.с. Цвета: ${data.colors?.join(", ")}. Узнайте всё о модели на CyberSite2077.`;
  const ogImage = activeImage || `${STATIC_URL}/defaults/default-card-icon.jpg`;

  //Breadcrumbs:
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog/motorcycles" },
    { label: data.brand.name, href: `/catalog/motorcycles/${data.brand.slug}` },
    { label: data.model }, // Текущая страница без ссылки
  ];

  //Объект микроразметки:
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${data.brand.name} ${data.model}`,
    image: [`http://localhost:3001/static/motorcycles/${data.mainImage}`],
    description: `Технические характеристики ${data.model}: ${data.displacement} см³, ${data.power} л.с.`,
    brand: {
      "@type": "Brand",
      name: data.brand.name,
    },
    offers: {
      "@type": "Offer",
      url: window.location.href,
      priceCurrency: "RUB",
      price: data.price,
      itemCondition: "https://schema.orgNewCondition",
      availability: "https://schema.orgInStock", //Указываем, что в наличии
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.rating,
      reviewCount: "85", //Пока хардкодим число отзывов
    },
  };

  //Задаю понятные названия:
  let STARTER;
  switch (data.starter) {
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
  switch (data.transmission) {
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
  switch (data.coolingSystem) {
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
  switch (data.gearbox) {
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
  switch (data.category) {
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
    data.images?.find((img) => img.isMain)?.url || data.images?.[0]?.url || ""; // Заглушка, если картинок нет вообще

  return (
    <main className={styles.Page}>
      {/*SEO:*/}
      <Helmet>
        {/*Мета-теги:*/}
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {/* Соцсети (Open Graph) */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="product" />

        {/*JSON-LD микроразметка:*/}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className={styles.container}>
        {/*Breadcrumbs:*/}
        <Breadcrumbs items={breadcrumbs} />

        {/* Фото и главные параметры */}
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
            <button
              className={styles.addToCartBtn}
              onClick={() =>
                addToCart({
                  id: data.id,
                  quantity: 1,
                  model: data.model,
                  price: data.price,
                  image: mainImageUrl,
                  brandSlug: data.brand.slug,
                  slug: data.slug,
                })
              }
            >
              🛒 В корзину
            </button>
            <p className={styles.description}>
              {data.year} года выпуска. Объем двигателя {data.displacement} см³.
            </p>
            <p className={styles.description}>Текущий рейтинг: {data.rating}</p>
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
              <SpecRow label="Тип двигателя" value={data.engineType} />
              <SpecRow label="Мощность" value={data.power} />
              <SpecRow
                label="Максимальная скорость, км/ч"
                value={data.topSpeed}
              />
              <SpecRow label="Коробка передач" value={GEARBOX} />
              <SpecRow label="Стартер" value={STARTER} />
              <SpecRow label="Топливная система" value={data.fuelSystem} />
              <SpecRow label="Система охлаждения" value={COOLING} />
              <SpecRow label="Трансмиссия" value={TRANSMISSION} />
              <SpecRow label="Заднее колесо" value={data.rearTyre} />
              <SpecRow label="Переднее колесо" value={data.frontTyre} />
              <SpecRow label="Задние тормоза" value={data.rearBrakes} />
              <SpecRow label="Передние тормоза" value={data.frontBrakes} />
              <SpecRow
                label="Расход топлива, л/100км"
                value={data.fuelConsumption}
              />
              <SpecRow
                label="Дополнительная информация"
                value={data.comments}
              />
              {/*Поле с цветами:*/}
              <div className={styles.specRow}>
                <span>Доступные цвета</span>
                <div className={styles.colorsWrapper}>
                  {data.colors && data.colors.length > 0 ? (
                    data.colors.map((color, index) => (
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
              <h3>О модели {data.model}:</h3>
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
                href="http://localhost:3001/static/docs/manual.pdf"
                target="_blank"
                rel="noreferrer"
                className={styles.downloadBtn}
              >
                📄 Скачать Manual.pdf (2.4 MB)
              </a>
            </div>
          )}
        </section>

        {/*Рекомендации:*/}
        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.sectionTitle}>Похожие модели</h2>
            <div className={styles.relatedGrid}>
              {related.map((moto) => (
                <MotorcycleCard key={moto.id} data={moto} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
