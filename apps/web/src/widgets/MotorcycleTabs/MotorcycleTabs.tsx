//Состояние:
import { useState } from "react";
//API:
import { API_URL } from "@/shared/api";
//Словари:
import {
  CATEGORY_MAP,
  GEARBOX_MAP,
  STARTER_MAP,
  COOLING_MAP,
  TRANSMISSION_MAP
} from "@/pages/MotorcycleDetailsPage/utils";
//Компоненты:
import { ReviewCard } from "@/entities/reviews";
import { SpecRow } from "@/shared/ui";
//Типы:
import type { MotorcycleReview } from "@/entities/catalog";
import { type IUser, type MotorcycleFull } from "@repo/types";
//Стили:
import styles from "./MotorcycleTabs.module.scss";

interface MotorcycleTabsProps {
  motorcycle: MotorcycleFull;
  reviews: MotorcycleReview[];
  onDeleteReview: (id: string) => void;
  user: IUser | undefined;
}

type TabType = "specs" | "description" | "warranty" | "docs" | "reviews";

export const MotorcycleTabs = ({ motorcycle, reviews, onDeleteReview, user }: MotorcycleTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("specs");

  //Переводим характеристики на понятный язык:
  const categoryLabel = CATEGORY_MAP[motorcycle.category] || motorcycle.category;
  const gearboxLabel = (motorcycle.gearbox && GEARBOX_MAP[motorcycle.gearbox]) || "Нет данных";
  const starterLabel = (motorcycle.starter && STARTER_MAP[motorcycle.starter]) || "Нет данных";
  const coolingLabel = (motorcycle.coolingSystem && COOLING_MAP[motorcycle.coolingSystem]) || "Нет данных";
  const transmissionLabel = (motorcycle.transmission && TRANSMISSION_MAP[motorcycle.transmission]) || "Нет данных";

  return (
    <div className={styles.tabsContainer}>
      {/* Навигация по табам */}
      <nav className={styles.tabsNav} role="tablist">
        <button className={activeTab === "specs" ? styles.activeTab : ""} onClick={() => setActiveTab("specs")} role="tab" aria-selected={activeTab === "specs"} tabIndex={activeTab === "specs" ? 0 : -1} aria-controls="specs-panel" id="specs-tab">
          Технические характеристики
        </button>
        <button className={activeTab === "description" ? styles.activeTab : ""} onClick={() => setActiveTab("description")} role="tab" aria-selected={activeTab === "description"} tabIndex={activeTab === "description" ? 0 : -1} aria-controls="description-panel" id="description-tab">
          Описание
        </button>
        <button className={activeTab === "reviews" ? styles.activeTab : ""} onClick={() => setActiveTab("reviews")} role="tab" aria-selected={activeTab === "reviews"} tabIndex={activeTab === "reviews" ? 0 : -1} aria-controls="reviews-panel" id="reviews-tab">
          Отзывы ({reviews?.length || 0})
        </button>
        <button className={activeTab === "warranty" ? styles.activeTab : ""} onClick={() => setActiveTab("warranty")} role="tab" aria-selected={activeTab === "warranty"} tabIndex={activeTab === "warranty" ? 0 : -1} aria-controls="warranty-panel" id="warranty-tab">
          Гарантия
        </button>
        <button className={activeTab === "docs" ? styles.activeTab : ""} onClick={() => setActiveTab("docs")} role="tab" aria-selected={activeTab === "docs"} tabIndex={activeTab === "docs" ? 0 : -1} aria-controls="docs-panel" id="docs-tab">
          Документы
        </button>
      </nav>

      {/* Контент табов */}
      <section className={styles.tabContent}>
        {/* Технические характеристики */}
        {activeTab === "specs" && (
          <div id="specs-panel" className={styles.specsGrid} role="tabpanel" aria-labelledby="specs-tab">
            <SpecRow label="Категория" value={categoryLabel} />
            <SpecRow label="Тип двигателя" value={motorcycle.engineType} />
            <SpecRow label="Мощность" value={motorcycle.power} />
            <SpecRow label="Максимальная скорость, км/ч" value={motorcycle.topSpeed} />
            <SpecRow label="Коробка передач" value={gearboxLabel} />
            <SpecRow label="Стартер" value={starterLabel} />
            <SpecRow label="Топливная система" value={motorcycle.fuelSystem} />
            <SpecRow label="Система охлаждения" value={coolingLabel} />
            <SpecRow label="Трансмиссия" value={transmissionLabel} />
            <SpecRow label="Заднее колесо" value={motorcycle.rearTyre} />
            <SpecRow label="Переднее колесо" value={motorcycle.frontTyre} />
            <SpecRow label="Задние тормоза" value={motorcycle.rearBrakes} />
            <SpecRow label="Передние тормоза" value={motorcycle.frontBrakes} />
            <SpecRow label="Расход топлива, л/100км" value={motorcycle.fuelConsumption} />
            <SpecRow label="Дополнительная информация" value={motorcycle.comments} />

            {/* Вывод доступных цветов */}
            <div className={styles.specRow}>
              <span>Доступные цвета</span>
              <div className={styles.colorsWrapper}>
                {motorcycle.colors && motorcycle.colors.length > 0 ? (
                  motorcycle.colors.map((color: string, index: number) => (
                    <div key={index} className={styles.colorItem}>
                      <span className={styles.colorDot} style={{ backgroundColor: color.toLowerCase() }} title={color} />
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

        {/* 2. Описание */}
        {activeTab === "description" && (
          <div id="description-panel" className={styles.staticText} role="tabpanel" aria-labelledby="description-tab">
            <h3>О модели {motorcycle.model}:</h3>
            <p>Эта модель создана для тех, кто не привык искать компромиссы между стилем и производительностью.</p>
            <p>Этот мотоцикл сочетает в себе передовые технологии своего времени. Сочетание выверенной эргономики и инженерных решений делает каждый выезд предсказуемым и захватывающим.</p>
            <p>Основные преимущества:</p>
            <ul>
              <li><strong>Надежность:</strong> каждая деталь спроектирована с учетом высоких нагрузок и длительной эксплуатации.</li>
              <li><strong>Комфорт:</strong> посадка снижает усталость райдера при длительных поездках.</li>
              <li><strong>Эстетика:</strong> дизайн, который притягивает взгляды и подчеркивает индивидуальность владельца.</li>
            </ul>
            <p>Все модели проходят строгий контроль качества перед поступлением в продажу.</p>
          </div>
        )}

        {/* 3. Отзывы */}
        {activeTab === "reviews" && (
          <div id="reviews-panel" className={styles.reviewsTab} role="tabpanel" aria-labelledby="reviews-tab">
            {reviews?.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review._id} review={review} onDelete={() => onDeleteReview(review._id)} currentUserId={user?.id} isAdmin={user?.role === "ADMIN"} />
              ))
            ) : (
              <div className={styles.noReviews}>
                <p>На эту модель пока нет отзывов. Станьте первым!</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Гарантия */}
        {activeTab === "warranty" && (
          <div id="warranty-panel" className={styles.staticText} role="tabpanel" aria-labelledby="warranty-tab">
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

        {/* 5. Документы */}
        {activeTab === "docs" && (
          <div id="docs-panel" className={styles.docsSection} role="tabpanel" aria-labelledby="docs-tab">
            <h3>Документация</h3>
            <p style={{ textAlign: "center" }}>Вы можете скачать полное руководство пользователя и сервисную книжку:</p>
            <a href={`${API_URL}/static/docs/manual.pdf`} target="_blank" rel="noreferrer" className={styles.downloadBtn}>
              📄 Скачать Manual.pdf (2.4 MB)
            </a>
          </div>
        )}
      </section>
    </div>
  );
};
