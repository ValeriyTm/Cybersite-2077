//Роутинг:
import { Link } from "react-router";
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
    src: "src/shared/assets/images/scrollGallery/bmw.png",
    slug: "bmw",
    alt: "BMW moto image",
  },
  {
    id: 2,
    src: "src/shared/assets/images/scrollGallery/ducati.png",
    slug: "ducati",
    alt: "ducati moto image",
  },
  {
    id: 3,
    src: "src/shared/assets/images/scrollGallery/harley.png",
    slug: "harley-davidson",
    alt: "harley davidson moto image",
  },
  {
    id: 4,
    src: "src/shared/assets/images/scrollGallery/honda.png",
    slug: "honda",
    alt: "honda moto image",
  },
  {
    id: 5,
    src: "src/shared/assets/images/scrollGallery/kawasaki.png",
    slug: "kawasaki",
    alt: "kawasaki moto image",
  },
  {
    id: 6,
    src: "src/shared/assets/images/scrollGallery/ktm.png",
    slug: "ktm",
    alt: "ktm moto image",
  },
  {
    id: 7,
    src: "src/shared/assets/images/scrollGallery/suzuki.png",
    slug: "suzuki",
    alt: "suzuki moto image",
  },
  {
    id: 8,
    src: "src/shared/assets/images/scrollGallery/yamaha.png",
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
                <img src={img.src} alt={img.alt || "gallery item"} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
