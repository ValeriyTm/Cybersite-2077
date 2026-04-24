//Состояния:
import { useState } from 'react';
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

export const AdminOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();
  const { user } = useProfile();

  const { data } = useQuery({
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

  const columns = getOrderColumns(
    (id, status) => statusMutation.mutate({ id, status }),
    user?.role
  );


  return (
    <div className={styles.pageWrapper}>
      <header className={styles.filterBar}>
        <label htmlFor="order-search" className='visually-hidden'>Поиск заказа по email</label>
        <input
          id='order-search'
          type='search'
          placeholder="Поиск по Email..."
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="order-status" className='visually-hidden'>Фильтрация заказа по статусу</label>
        <select onChange={(e) => setStatus(e.target.value)} className={styles.statusSelect} id='order-status'>
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
