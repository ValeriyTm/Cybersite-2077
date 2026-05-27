import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
//Навигация:
import { Link } from 'react-router';
//API:
import { API_URL } from '@/shared/api';
//Стили:
import styles from './NewsCard.module.scss';

interface NewsCardProps {
  item: {
    _id: string;
    slug: string;
    mainImage?: string;
    title: string;
    tags?: string[];
    createdAt: string;
    excerpt: string;
  };
}

export const NewsCard = ({ item }: NewsCardProps) => {
  const imageUrl = item.mainImage
    ? `${API_URL}/static/news/${item.mainImage}`
    : '/no-image.jpg';

  const formattedDate = item.createdAt
    ? format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: ru })
    : 'Дата неизвестна';

  return (
    <Link to={`/news/${item.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={item.title} width='345' height='220' loading="lazy" />
        <div className={styles.categoryBadge}>{item.tags?.[0] || 'Новость'}</div>
      </div>

      <div className={styles.info}>
        <span className={styles.date}>{formattedDate}</span>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <span className={styles.readMore}>Читать далее →</span>
      </div>
    </Link>
  );
};
