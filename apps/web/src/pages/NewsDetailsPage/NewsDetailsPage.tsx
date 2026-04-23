//Извлечение параметров URL:
import { useParams } from 'react-router';
//Состояния:
import { useQuery } from '@tanstack/react-query';
//API:
import { $api, API_URL } from '@/shared/api/api';
//SEO:
import { Helmet } from 'react-helmet-async';
//Работа с датами:
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
//Компоненты:
import { NewsMotoWidget } from './NewsMotoWidget';
//Стили:
import styles from './NewsDetailsPage.module.scss';

export const NewsDetailsPage = () => {
    const { slug } = useParams<{ slug: string }>();
    console.log('slug: ', slug)
    const { data: article, isLoading } = useQuery({
        queryKey: ['news-article', slug],
        queryFn: () => $api.get(`/content/news/${slug}`).then(res => res.data)
    });

    //SEO:
    const canonicalUrl = `${API_URL}/content/news/${slug}`;
    const seoTitle = `Cybersite-2077 | Новость ${slug}`

    if (isLoading) return <div className={styles.loader}>Дешифровка данных...</div>;
    if (!article) return <div className={styles.error}>Объект не найден в системе</div>;

    return (
        <>
            <Helmet>
                <title>{seoTitle}</title>
                <link rel="canonical" href={canonicalUrl} />
            </Helmet>
            <article className={styles.article}>
                <header className={styles.header}>
                    <div className={styles.meta}>
                        <span className={styles.date}>
                            {format(new Date(article.createdAt), 'dd MMMM yyyy', { locale: ru })}
                        </span>
                        {/* <span className={styles.author}>ID_AUTHOR: {article.authorId.slice(0, 8)}</span> */}
                    </div>
                    <h1 className={styles.title}>{article.title}</h1>
                    {article.mainImage && (
                        <div className={styles.mainImage}>
                            <img src={`${API_URL}/static/news/${article.mainImage}`} alt={article.title} width='598'
                                height='298' />
                        </div>
                    )}
                </header>

                <div className={styles.content}>
                    {article.content.map((block: any, index: number) => {
                        switch (block.type) {
                            case 'text':
                                return <p key={index} className={styles.textBlock}>{block.value}</p>;
                            case 'image':
                                return (
                                    <figure key={index} className={styles.imageBlock}>
                                        <img src={`${API_URL}/static/news/${block.value}`} alt="Content" />
                                    </figure>
                                );
                            case 'motorcycle':
                                return <NewsMotoWidget key={index} motoId={block.value} />;
                            case 'video':
                                return (
                                    <div key={index} className={styles.videoBlock}>
                                        <iframe src={`https://youtube.com{block.value}`} allowFullScreen></iframe>
                                    </div>
                                );
                            default:
                                return null;
                        }

                    })}
                </div>
            </article>
        </>
    );
};
