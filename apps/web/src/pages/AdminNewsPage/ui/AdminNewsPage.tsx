//Состояния:
import { useState } from 'react';
import { useAdminNews } from '@/entities/admin';
import { useAdminNewsDelete, useAdminNewsSave, useAdminNewsStatus } from '@/features/admin';
import { useProfile } from '@/features/auth';
//Формирование таблицы:
import { ActionConfirmModal, Button, DataTable } from '@/shared/ui';
import { newsColumns } from '../model/columns';
//Компоненты:
import { NewsModal } from './components';
//Типы:
import type { News } from '@/entities/content';
//Стили:
import styles from './AdminNewsPage.module.scss';

export const AdminNewsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);

  const { user } = useProfile(); //Данные юзера
  const userRole = user?.role;
  const isRestricted = userRole == "WATCHER";

  //Получение новостей:
  const { data: news } = useAdminNews();

  //Мутация для создания / обновления новости:
  const saveMutation = useAdminNewsSave({ editingNews, setIsModalOpen });
  //Мутация для удаления новости:
  const deleteMutation = useAdminNewsDelete();
  //Мутация для смены статуса:
  const statusMutation = useAdminNewsStatus();

  //Обработчик подтверждения удаления новости:
  const handleDeleteConfirm = () => {
    if (deletingNewsId) {
      deleteMutation.mutate(deletingNewsId, {
        onSuccess: () => setDeletingNewsId(null)
      });
    }
  };

  const columns = newsColumns(
    (item) => {
      setEditingNews(item);
      setIsModalOpen(true);
    },
    (id) => {
      setDeletingNewsId(id);
    },
    (id, status) => statusMutation.mutate({ id, status })
  );

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h3>Управление новостями</h3>
        <Button
          type="submit"
          variant="outline-dark"
          onClick={() => { setEditingNews(null); setIsModalOpen(true); }}
        >
          + Создать новость
        </Button>
      </header>

      <DataTable columns={columns} data={news || []} />

      {isModalOpen && (
        <NewsModal
          news={editingNews as News}
          onClose={() => setIsModalOpen(false)}
          isRestricted={isRestricted}
          onSubmit={(formData: FormData) => saveMutation.mutate(formData)}
        />
      )}

      <ActionConfirmModal
        isOpen={Boolean(deletingNewsId)}
        variant="danger"
        title="Удаление новости"
        description="Вы уверены, что хотите удалить эту новость? Это действие невозможно отменить."
        confirmText="Удалить"
        role={userRole}
        cancelText="Отмена"
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingNewsId(null)}
      />
    </div>
  );
};
