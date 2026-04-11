import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { NewsModal } from './NewsModal'; // Сейчас создадим
import { newsColumns } from '../model/columns';
import toast from 'react-hot-toast';
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

    // 🎯 МУТАЦИЯ для смены статуса
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            $api.patch(`/admin/news/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            toast.success('Статус новости изменен');
        },
        onError: () => toast.error('Не удалось изменить статус')
    });


    const columns = newsColumns(
        (item) => { setEditingNews(item); setIsModalOpen(true); },
        (id) => { /* логика удаления */ },
        (id, status) => statusMutation.mutate({ id, status }) // <-- Новая функция
    );

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <h3>Управление новостями (Mongo)</h3>
                <button className={styles.addBtn} onClick={() => { setEditingNews(null); setIsModalOpen(true); }}>
                    + Создать новость
                </button>
            </header>

            <DataTable columns={columns} data={news || []} />

            {isModalOpen && (
                <NewsModal
                    news={editingNews}
                    onClose={() => setIsModalOpen(false)}
                    // 🎯 ВОТ ЭТОГО ПРОПСА НЕ ХВАТАЛО:
                    onSubmit={(formData: FormData) => saveMutation.mutate(formData)}
                />
            )}
        </div>
    );
};
