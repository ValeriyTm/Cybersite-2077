//Извлечение параметров:
import { useSearchParams } from 'react-router';
//Состояния:
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
//API:
import { $api } from '@/shared/api';
//Формирование таблицы:
import { DataTable } from '@/shared/ui';
import { stockColumns } from '../model/columns';
//Уведомления:
import toast from 'react-hot-toast';
//Стили:
import styles from './AdminStocksPage.module.scss';

export const AdminStocksPage = () => {
    const [searchParams] = useSearchParams();
    const motoId = searchParams.get('motoId');
    const [tempQuantity, setTempQuantity] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-stocks', motoId],
        queryFn: () => $api.get('/admin/stocks', { params: { motoId } }).then(res => res.data),
        enabled: !!motoId
    });

    const updateMutation = useMutation({
        mutationFn: (val: number) => $api.patch(`/admin/stocks/${editingStock.id}`, { quantity: val }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stocks'] });
            setIsModalOpen(false);
            toast.success('Запасы обновлены');
        }
    });

    const columns = stockColumns((stock) => {
        setEditingStock(stock);
        setIsModalOpen(true);
    });

    if (isLoading) return <div>Загрузка...</div>;

    if (!data?.data || data.data.length === 0) {
        return <div className={styles.empty}>Сначала выберите модель мотоцикла на вкладке "Мотоциклы".</div>;
    }

    return (
        <div className={styles.pageWrapper}>
            <h3>
                Запасы модели:
                <span style={{ color: '#f39c12', marginLeft: '10px' }}>
                    {data.data[0]?.motorcycle?.model}
                </span>
            </h3>

            <DataTable columns={columns} data={data.data} />

            {/*Добавляем модалку, чтобы редактирование заработало:*/}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h4>Обновить наличие</h4>
                        <p>{editingStock?.warehouse?.name} ({editingStock?.warehouse?.city})</p>
                        <input
                            type="number"
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(Number(e.target.value))}
                            autoFocus
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsModalOpen(false)}>Отмена</button>
                            <button
                                className={styles.saveBtn}
                                onClick={() => updateMutation.mutate(tempQuantity)}
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
