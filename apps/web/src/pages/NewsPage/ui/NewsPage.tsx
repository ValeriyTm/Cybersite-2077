//Состояния:
import { useNews } from '@/entities/content';
//Компоненты:
import { NewsCard } from '@/entities/content';
//SEO:e
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from './NewsPage.module.scss';

const canonicalUrl = `${import.meta.env.VITE_SITE_URL}/news`;

export const NewsPage = () => {
  //Получаем новости:
  const { data: news, isLoading } = useNews();

  if (isLoading) return <div className={styles.loader}>Сканирование новостной ленты...</div>;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Новости</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Последние события <span>Cybersite-2077</span></h1>
          <div className={styles.divider}></div>
        </header>

        {news && news.length > 0 ? (
          <div className={styles.newsGrid}>
            {news.map((item) => (
              <NewsCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          /* UX-заглушка на случай отсутствия записей: */
          <div className={styles.emptyState}>
            <p>В данный момент новостная лента пуста. Загляните к нам чуть позже! 🏍️</p>
          </div>
        )}
      </div>
    </>
  );
};
