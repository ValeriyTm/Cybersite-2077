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
        // Умная установка главного фото:
        // Если в базе есть помеченное как isMain — берем его, иначе первое из списка, иначе дефолт
        const mainImg =
          res.images?.find((img) => img.isMain)?.url || res.images?.[0]?.url;

        setActiveImage(mainImg ? `${STATIC_URL}/${mainImg}` : DEFAULT_IMG);
      });
    }
  }, [brandSlug, slug]);

  useEffect(() => {
    if (slug) {
      // 1. Очищаем старые рекомендации перед загрузкой новых 🧹
      setRelated([]);

      // 2. Загружаем новые
      fetchRelatedMotorcycles(slug)
        .then(setRelated)
        .catch((err) => console.error("Ошибка загрузки рекомендаций:", err));
    }
  }, [slug]);

  if (!data) return <div className={styles.loader}>Загрузка данных...</div>;

  //Формируем SEO-строки:
  const seoTitle = `${data.brand.name} ${data.model} ${data.year} г.в. — Характеристики и цены | CyberBike`;
  const seoDescription = `Подробные технические характеристики ${data.brand.name} ${data.model}: двигатель ${data.displacement} см³, мощность ${data.power} л.с. Цвета: ${data.colors?.join(", ")}. Узнайте всё о модели на CyberBike.`;
  const ogImage = activeImage || `${STATIC_URL}/defaults/default-card-icon.jpg`;

  //Breadcrumbs:
  const breadcrumbs = [
    { label: "Каталог", href: "/catalog/motorcycles" },
    { label: data.brand.name, href: `/catalog/motorcycles/${data.brand.slug}` },
    { label: data.model }, // Текущая страница без ссылки
  ];

  return (
    <main className={styles.Page}>
      {/*SEO:*/}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {/* Соцсети (Open Graph) */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="product" />
      </Helmet>

      <div className={styles.container}>
        {/*Breadcrumbs:*/}
        <Breadcrumbs items={breadcrumbs} />

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
              {data.year} года выпуска. Объем двигателя {data.displacement} см³.
            </p>
            <p className={styles.description}>Текущий рейтинг: {data.rating}</p>
          </div>
        </section>

        {/* 2. Таблица характеристик:*/}

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
              <SpecRow label="Категория" value={data.category} />
              <SpecRow label="Тип двигателя" value={data.engineType} />
              <SpecRow label="Мощность" value={data.power} />
              <SpecRow
                label="Максимальная скорость, км/ч"
                value={data.topSpeed}
              />
              <SpecRow label="Коробка передач" value={data.gearbox} />
              <SpecRow label="Стартер" value={data.starter} />
              <SpecRow label="Топливная система" value={data.fuelSystem} />
              <SpecRow label="Система охлаждения" value={data.coolingSystem} />
              <SpecRow label="Трансмиссия" value={data.transmission} />
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
              <p>
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
