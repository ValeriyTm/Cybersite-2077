//Состояние:
import { useMotoForNews } from '@/entities/content';
//Компоненты:
import { MotorcycleCard } from '@/widgets/MotorcycleCard';
//Стили:
import styles from './NewsMotoWidget.module.scss';

export const NewsMotoWidget = ({ motoId }: { motoId: string }) => {

  //Получаем данные для мотоцикла:
  const { data: moto, isLoading } = useMotoForNews(motoId);

  if (isLoading) return <div className={styles.loading} />;
  if (!moto) return null;

  return (
    <div className={styles.wrapper}>
      <p >
        Упомянутая модель:
      </p>
      <div className={styles.motoCard}>
        <MotorcycleCard moto={moto} viewMode="grid" />
      </div>
    </div>
  );
};
