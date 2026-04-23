//Состояния:
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
//Формирование таблицы:
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { newsColumns } from '../model/columns';
//API:
import { $api } from '@/shared/api/api';
//Компоненты:
import { NewsModal } from './NewsModal';
//Уведомления:
import toast from 'react-hot-toast';
//Стили:
import styles from './AdminNewsPage.module.scss';

export const AdminNewsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const queryClient = useQueryClient();

  const { data: news, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => $api.get('/admin/news').then(res => res.data)
  });

  const saveMutation = useMutation({
    mutationFn: (formData: FormData) =>
      editingNews
        ? $api.patch(`/admin/news/${editingNews._id}`, formData)
        : $api.post('/admin/news', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      setIsModalOpen(false);
      toast.success('Новость сохранена');
    },
    onError: () => toast.error('Ошибка при сохранении')
  });

  //Мутация для смены статуса:
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      $api.patch(`/admin/news/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('Статус новости изменен');
    },
    onError: () => toast.error('Не удалось изменить статус')
  });

  //Мутация для удаления:
  const deleteMutation = useMutation({
    mutationFn: (id: string) => $api.delete(`/admin/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('Новость успешно удалена');
    },
    onError: () => toast.error('Ошибка при удалении новости')
  });


  const columns = newsColumns(
    (item) => {
      setEditingNews(item);
      setIsModalOpen(true);
    },
    (id) => {
      //Добавляем подтверждение, чтобы не удалить случайно:
      if (window.confirm("Вы уверены, что хотите удалить эту новость?")) {
        deleteMutation.mutate(id);
      }
    },
    (id, status) => statusMutation.mutate({ id, status })
  );

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h3>Управление новостями</h3>
        <button className={styles.addBtn} onClick={() => { setEditingNews(null); setIsModalOpen(true); }}>
          + Создать новость
        </button>
      </header>

      <DataTable columns={columns} data={news || []} />

      {isModalOpen && (
        <NewsModal
          news={editingNews}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(formData: FormData) => saveMutation.mutate(formData)}
        />
      )}
    </div>
  );
};
