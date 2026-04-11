import { useQuery } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './NewsPage.module.scss';

export const NewsPage = () => {
    const { data: news, isLoading } = useQuery({
        queryKey: ['public-news'],
        queryFn: () => $api.get('/content/news').then(res => res.data)
    });

    if (isLoading) return <div className={styles.loader}>Сканирование новостной ленты...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Последние события <span>Cybersite-2077</span></h1>
                <div className={styles.divider}></div>
            </header>

            <div className={styles.newsGrid}>
                {news?.map((item: any) => (
                    <Link key={item._id} to={`/news/${item.slug}`} className={styles.card}>
                        <div className={styles.imageWrapper}>
                            <img
                                src={item.mainImage ? `http://localhost:3001/static/motorcycles/${item.mainImage}` : '/no-image.jpg'}
                                alt={item.title}
                            />
                            <div className={styles.categoryBadge}>{item.tags?.[0] || 'Новость'}</div>
                        </div>

                        <div className={styles.info}>
                            <span className={styles.date}>
                                {format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: ru })}
                            </span>
                            <h3>{item.title}</h3>
                            <p>{item.excerpt}</p>
                            <span className={styles.readMore}>Читать далее →</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
