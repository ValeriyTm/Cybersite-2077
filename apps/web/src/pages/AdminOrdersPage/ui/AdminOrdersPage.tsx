//Состояния:
import { useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useProfile } from '@/features/auth';
//Формирование таблицы:
import { DataTable } from '@/shared/ui';
import { getOrderColumns } from '../model/columns';
//API:
import { $api } from '@/shared/api';
//Уведомления:
import toast from 'react-hot-toast';
//Стили:
import styles from './AdminOrdersPage.module.scss'
import type { OrderResponse, OrderStatusUp } from '@/entities/admin/types/types';


interface UpdateStatusPayload {
  id: string;
  status: OrderStatusUp;
}

export const AdminOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatusUp | ''>('');
  const [email, setEmail] = useState('');

  const queryClient = useQueryClient();
  const { user } = useProfile();

  const { data } = useQuery<OrderResponse>({
    queryKey: ['admin-orders', page, status, email],
    queryFn: () => $api.get<OrderResponse>('/admin/orders', { params: { page, status, email } }).then(res => res.data)
  });

  console.log('data: adm ', data);

  const statusMutation = useMutation<unknown, Error, UpdateStatusPayload>({
    mutationFn: ({ id, status }) => $api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Статус обновлен');
    }
  });

  const columns = getOrderColumns(
    (id: string, status: OrderStatusUp) => statusMutation.mutate({ id, status }),
    user?.role
  );

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as OrderStatusUp | '');

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.filterBar}>
        <label htmlFor="order-search" className='visually-hidden'>Поиск заказа по email</label>
        <input
          id='order-search'
          type='search'
          placeholder="Поиск по Email..."
          onChange={handleEmailChange}
        />

        <label htmlFor="order-status" className='visually-hidden'>Фильтрация заказа по статусу</label>
        <select onChange={handleStatusChange} className={styles.statusSelect} id='order-status'>
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
