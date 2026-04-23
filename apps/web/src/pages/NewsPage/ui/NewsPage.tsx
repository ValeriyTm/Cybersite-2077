//Состояния:
import { useQuery } from '@tanstack/react-query';
//API:
import { $api, API_URL } from '@/shared/api/api';
//SEO:
import { Helmet } from 'react-helmet-async';
//Роутинг:
import { Link } from 'react-router';
//Работа с датами:
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
//Стили:
import styles from './NewsPage.module.scss';

export const NewsPage = () => {
    const { data: news, isLoading } = useQuery({
        queryKey: ['public-news'],
        queryFn: () => $api.get('/content/news').then(res => res.data)
    });

    //SEO:
    const canonicalUrl = `${API_URL}/news`;

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

                <div className={styles.newsGrid}>
                    {news?.map((item: any) => (
                        <Link key={item._id} to={`/news/${item.slug}`} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <img
                                    src={item.mainImage ? `${API_URL}/static/news/${item.mainImage}` : '/no-image.jpg'}
                                    alt={item.title}
                                    width='345'
                                    height='220'
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
        </>
    );
};
