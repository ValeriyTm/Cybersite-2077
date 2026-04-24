//Роутинг:
import { Link } from "react-router";
//Изображения:
import bmwLogo from '@/shared/assets/images/scrollGallery/bmw.png';
import ducatiLogo from '@/shared/assets/images/scrollGallery/ducati.png';
import harleyLogo from '@/shared/assets/images/scrollGallery/harley.png';
import hondaLogo from '@/shared/assets/images/scrollGallery/honda.png';
import kawasakiLogo from '@/shared/assets/images/scrollGallery/kawasaki.png';
import ktmLogo from '@/shared/assets/images/scrollGallery/ktm.png';
import suzukiLogo from '@/shared/assets/images/scrollGallery/suzuki.png';
import yamahaLogo from '@/shared/assets/images/scrollGallery/bmw.png';
//Стили:
import styles from "./ScrollableImageGallery.module.scss";

interface ImageItem {
  id: number;
  src: string;
  slug: string;
  alt: string;
}

const myImages: ImageItem[] = [
  {
    id: 1,
    src: bmwLogo,
    slug: "bmw",
    alt: "BMW moto image",
  },
  {
    id: 2,
    src: ducatiLogo,
    slug: "ducati",
    alt: "ducati moto image",
  },
  {
    id: 3,
    src: harleyLogo,
    slug: "harley-davidson",
    alt: "harley davidson moto image",
  },
  {
    id: 4,
    src: hondaLogo,
    slug: "honda",
    alt: "honda moto image",
  },
  {
    id: 5,
    src: kawasakiLogo,
    slug: "kawasaki",
    alt: "kawasaki moto image",
  },
  {
    id: 6,
    src: ktmLogo,
    slug: "ktm",
    alt: "ktm moto image",
  },
  {
    id: 7,
    src: suzukiLogo,
    slug: "suzuki",
    alt: "suzuki moto image",
  },
  {
    id: 8,
    src: yamahaLogo,
    slug: "yamaha",
    alt: "yamaha moto image",
  },
];

<div className={styles.decoration}></div>;

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
