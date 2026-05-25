//Компоненты:
import { ReviewCardHome } from "@/shared/ui";
//Изображения:
import faceIcon1 from '@/shared/assets/images/reviews/face1.jpg';
import faceIcon2 from '@/shared/assets/images/reviews/face2.jpg';
import faceIcon3 from '@/shared/assets/images/reviews/face3.jpg';
import faceIcon4 from '@/shared/assets/images/reviews/face4.jpg';
//Стили:
import styles from './ReviewSection.module.scss';

// Выносим данные отзывов в чистый массив
const REVIEWS_DATA = [
  {
    id: 1,
    name: "Алексей Иванов",
    avatarUrl: faceIcon1,
    rating: 5,
    text: "Периодически заказываю тут мотоэкипировку - дешевле на 15-20%, чем в других местах. Шлем, купленный тут 10 лет назад, до сих пор целый 👍"
  },
  {
    id: 2,
    name: "Регина Петрова",
    avatarUrl: faceIcon2,
    rating: 4,
    text: "Отличный магазин! Доставили быстро, товар качественный. Оранжевая упаковка просто огонь."
  },
  {
    id: 3,
    name: "Алихан Ахметов",
    avatarUrl: faceIcon3,
    rating: 5,
    text: "Поражает ассортимент мотоциклов! Есть даже модели начала 1900-х годов, вот это да!"
  },
  {
    id: 4,
    name: "Степан Васильев",
    avatarUrl: faceIcon4,
    rating: 5,
    text: "Постоянно тут покупаем детали для нашего мотосервиса. Радуют длительная гарантия и быстрые ответы поддержки"
  }
];

export const ReviewSection = () => {
  return (
    <div className={styles.reviewSection}>
      <p>Отзывы наших постоянных клиентов:</p>
      <div className={styles.reviewContainer}>
        <section className={styles.reviewCardSection}>
          {REVIEWS_DATA.map((review) => (
            <ReviewCardHome
              key={review.id}
              name={review.name}
              avatarUrl={review.avatarUrl}
              rating={review.rating}
              text={review.text}
            />
          ))}
        </section>
      </div>
    </div>
  );
};
