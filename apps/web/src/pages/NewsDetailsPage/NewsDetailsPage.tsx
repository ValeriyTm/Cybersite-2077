import { useParams } from 'react-router'; // Помним про твой фикс с импортом!
import { useQuery } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { NewsMotoWidget } from './NewsMotoWidget';
import styles from './NewsDetailsPage.module.scss';

export const NewsDetailsPage = () => {
    const { slug } = useParams<{ slug: string }>(); //Берем slug из URL
    console.log('slug: ', slug)
    const { data: article, isLoading } = useQuery({
        queryKey: ['news-article', slug], //Query зависит от slug
        queryFn: () => $api.get(`/content/news/${slug}`).then(res => res.data)
    });

    if (isLoading) return <div className={styles.loader}>Дешифровка данных...</div>;
    if (!article) return <div className={styles.error}>Объект не найден в системе</div>;

    return (
        <article className={styles.article}>
            <header className={styles.header}>
                <div className={styles.meta}>
                    <span className={styles.date}>
                        {format(new Date(article.createdAt), 'dd MMMM yyyy', { locale: ru })}
                    </span>
                    <span className={styles.author}>ID_AUTHOR: {article.authorId.slice(0, 8)}</span>
                </div>
                <h1 className={styles.title}>{article.title}</h1>
                {article.mainImage && (
                    <div className={styles.mainImage}>
                        <img src={`http://localhost:3001/static/news/${article.mainImage}`} alt={article.title} />
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
                                    <img src={`http://localhost:3001/static/news/${block.value}`} alt="Content" />
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
    );
};
