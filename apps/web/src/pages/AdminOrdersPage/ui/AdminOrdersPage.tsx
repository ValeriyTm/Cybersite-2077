import styles from './AdminOrdersPage.module.scss'
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { getOrderColumns } from '../model/columns';
import toast from 'react-hot-toast';

export const AdminOrdersPage = () => {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [email, setEmail] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-orders', page, status, email],
        queryFn: () => $api.get('/admin/orders', { params: { page, status, email } }).then(res => res.data)
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: any) => $api.patch(`/admin/orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Статус обновлен');
        }
    });

    const columns = getOrderColumns((id, newStatus) => statusMutation.mutate({ id, status: newStatus }));


    return (
        <div className={styles.pageWrapper}>
            <header className={styles.filterBar}>
                <input
                    placeholder="Поиск по Email..."
                    onChange={(e) => setEmail(e.target.value)}
                />

                <select onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Все статусы</option>
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELED">CANCELED</option>
                    <option value="DELIVERY">DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="COMPLETED">COMPLETED</option>
                </select>
            </header>

            <DataTable columns={columns} data={data?.data || []} />

            <div className={styles.pagination}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Назад</button>
                <span>Страница {page} из {data?.meta?.lastPage || 1}</span>
                <button disabled={page >= (data?.meta?.lastPage || 1)} onClick={() => setPage(p => p + 1)}>Вперёд</button>
            </div>
        </div>
    );
};
