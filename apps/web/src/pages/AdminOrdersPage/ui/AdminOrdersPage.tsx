//Состояния:
import { useState, type ChangeEvent } from 'react';
import { useProfile } from '@/features/auth';
import { useAdminOrders } from '@/entities/admin';
import { useAdminOrdersStatus } from '@/features/admin';
//Формирование таблицы:
import { DataTable, Input, Pagination, Select } from '@/shared/ui';
import { getOrderColumns } from '../model/columns';
//Категории:
import { STATUS_OPTIONS } from '../model/items';
//Типы:
import type { OrderStatusUp } from '@/entities/admin/types/types';
//Стили:
import styles from './AdminOrdersPage.module.scss'


export const AdminOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatusUp | ''>('');
  const [email, setEmail] = useState('');

  const { user } = useProfile();

  //Получаем данные о заказах:
  const { data } = useAdminOrders(page, status, email);
  //Мутация изменения статуса заказа:
  const statusMutation = useAdminOrdersStatus();

  const columns = getOrderColumns(
    (id: string, status: OrderStatusUp) => statusMutation.mutate({ id, status }),
    user?.role
  );

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as OrderStatusUp | '');

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.filterBar}>
        <Input
          label="Поиск заказа по email пользователя"
          id='order-search'
          type='search'
          title="Поиск по модели мотоцикла"
          placeholder="🔍 Поиск по Email..."
          variant="dark"
          onChange={handleEmailChange}
          visuallyHidden
        />

        <Select
          id="order-status"
          label="Фильтрация заказа по статусу"
          options={STATUS_OPTIONS}
          data-status={status}
          onChange={handleStatusChange}
          variant="dark"
          direction="column"
          visuallyHidden
        />
      </header>

      <DataTable columns={columns} data={data?.data || []} />

      <Pagination
        currentPage={page}
        totalPages={data?.meta?.lastPage || 1}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};
