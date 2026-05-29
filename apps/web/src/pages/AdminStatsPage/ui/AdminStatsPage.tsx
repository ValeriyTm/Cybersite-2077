//Состояния:
import { useState } from 'react';
import { useAdminSyncDB } from '@/features/admin';
//Компоненты:
import { ActionConfirmModal, Button } from '@/shared/ui';
//Иконки:
import { FaSync } from 'react-icons/fa';
//Стили:
import styles from './AdminStatsPage.module.scss';

export const AdminStatsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  //Мутация запуска синхронизации на сервере:
  const syncMutation = useAdminSyncDB();

  //Функция запуска синхронизации:
  const handleConfirmSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: () => {
        setIsModalOpen(false);
      }
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <h3>Техническое обслуживание</h3>

      <div className={styles.card}>
        <div className={styles.cardInfo}>
          <h4>Глобальная синхронизация поиска</h4>
          <p>Удаляет текущие данные из поискового движка (Elasticsearch) и по-новому заполняет данными из основной базы данных (PostgreSQL). Используйте, если поиск работает некорректно.</p>
        </div>

        <Button
          type="submit"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          disabled={syncMutation.isPending}
        >
          <FaSync className={syncMutation.isPending ? styles.spin : ''} />
          {syncMutation.isPending ? 'Синхронизация...' : 'Запустить переиндексацию'}
        </Button>
      </div>

      <ActionConfirmModal
        isOpen={isModalOpen}
        title="Синхронизация базы данных"
        description="Это действие удалит текущий индекс поиска в Elasticsearch и пересоздаст его на основе PostgreSQL. Вы уверены, что хотите продолжить?"
        variant="info"
        confirmText="Продолжить"
        cancelText="Назад"
        isSubmitting={syncMutation.isPending}
        onConfirm={handleConfirmSync}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};
