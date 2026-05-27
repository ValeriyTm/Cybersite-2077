import { useState } from "react";
//Навигация:
import { Link } from "react-router";
// Константы и типы из Entities:
import { TOP_BRANDS } from "@/features/catalog/lib";
// Иконки и изображения из Shared Assets:
import motoIcon from '@/shared/assets/icons/catalog-icons/moto-icon.png';
import equipIcon from '@/shared/assets/icons/catalog-icons/equip-icon.png';
import gearIcon from '@/shared/assets/icons/catalog-icons/gear-icon.webp';
import scooterIcon from '@/shared/assets/icons/moto_brands/scooter.png';
//Стили:
import styles from "./HeaderCatalog.module.scss";

type MainCategory = "moto" | "gear" | "parts";

export const HeaderCatalog = () => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeMainCat, setActiveMainCat] = useState<MainCategory>("moto");

  return (
    <div
      className={styles.catalogWrapper}
      onMouseEnter={() => setIsCatalogOpen(true)}
      onMouseLeave={() => setIsCatalogOpen(false)}
      aria-expanded={isCatalogOpen}
      aria-controls="catalog-preview"
    >
      <Link to="/catalog" className={styles.catalogBtn}>
        <span className={styles.burger}>☰</span> Каталог
      </Link>

      {/* Выпадающее Hover-меню */}
      {isCatalogOpen && (
        <div className={styles.dropdown} id="catalog-preview" hidden={!isCatalogOpen}>
          <div className={styles.dropdownContent}>

            {/* Левая панель - группы товаров */}
            <aside className={styles.sideNav}>
              <div
                className={`${styles.sideItem} ${activeMainCat === "moto" ? styles.activeSide : ""}`}
                onMouseEnter={() => setActiveMainCat("moto")}
              >
                <img src={motoIcon} alt="motorcycle icon" width="24" height="24" />
                <span>Мототехника</span>
                <span className={styles.arrow}>›</span>
              </div>

              <div className={`${styles.sideItem} ${styles.disabled}`}>
                <img src={equipIcon} alt="equipment icon" width="24" height="24" />
                <span>Экипировка</span>
                <span className={styles.arrow}>›</span>
              </div>

              <div className={`${styles.sideItem} ${styles.disabled}`}>
                <img src={gearIcon} alt="gear icon" width="24" height="24" />
                <span>Запчасти</span>
                <span className={styles.arrow}>›</span>
              </div>
            </aside>

            {/* Правая панель - бренды */}
            <section className={styles.mainPanel}>
              {activeMainCat === "moto" ? (
                <div className={styles.brandsGrid}>
                  {TOP_BRANDS.map((brand) => (
                    <Link
                      key={brand.slug}
                      to={`/catalog/motorcycles/${brand.slug}`}
                      className={styles.brandItem}
                      onClick={() => setIsCatalogOpen(false)}
                    >
                      <div className={styles.brandIcon}>
                        <img src={brand.logo} alt={`moto ${brand.name}`} width="32" height="32" />
                      </div>
                      <span>Мотоциклы <strong>{brand.name}</strong></span>
                    </Link>
                  ))}

                  {/* Кнопка прочих брендов */}
                  <Link
                    to="/catalog/motorcycles"
                    className={styles.brandItem}
                    onClick={() => setIsCatalogOpen(false)}
                  >
                    <div className={styles.brandIcon}>
                      <img src={scooterIcon} alt="alternative brand icon" width="32" height="32" />
                    </div>
                    <span>Прочие бренды</span>
                  </Link>
                </div>
              ) : (
                <div className={styles.emptyPanel}>
                  Скоро в продаже...
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
