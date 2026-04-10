

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './AdminStocksPage.module.scss';
import { useState } from 'react';
import { $api } from '@/shared/api/api';
import toast from 'react-hot-toast';
import { stockColumns } from '../model/columns';
import { DataTable } from '@/shared/ui/DataTable/DataTable';

export const AdminStocksPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<any>(null);
    const queryClient = useQueryClient();



    const { data, isLoading } = useQuery({
        queryKey: ['admin-stocks'],
        queryFn: () => $api.get('/admin/stocks').then(res => res.data)
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

    return (
        <div className={styles.pageWrapper}>
            <h3>Управление запасами</h3>
            <DataTable columns={columns} data={data?.data || []} />

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h4>Обновить наличие</h4>
                        <p>{editingStock.motorcycle.model} ({editingStock.warehouse.name})</p>
                        <input
                            type="number"
                            defaultValue={editingStock.quantity}
                            onKeyDown={(e) => e.key === 'Enter' && updateMutation.mutate(Number(e.currentTarget.value))}
                            autoFocus
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsModalOpen(false)}>Отмена</button>
                            <button className={styles.saveBtn} onClick={() => {
                                const val = document.querySelector('input')?.value;
                                updateMutation.mutate(Number(val));
                            }}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
