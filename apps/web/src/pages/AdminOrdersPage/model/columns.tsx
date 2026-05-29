//Типы:
import { type ColumnDef } from '@tanstack/react-table';
import type { OrderFromServer, OrderItem, OrderStatusUp } from '@/entities/admin/types/types';
//Работа с датами:
import { format } from 'date-fns';
//Компоненты:
import { Select } from '@/shared/ui';
//Категории:
import { STATUS_SINGLE_OPTIONS } from './items';
//Стили:
import styles from './columns.module.scss';

//Типы:
export const getOrderColumns = (
  onStatusChange: (id: string, newStatus: OrderStatusUp) => void,
  userRole: string | undefined
): ColumnDef<OrderFromServer>[] => [
    {
      accessorKey: 'orderNumber',
      header: '№ Заказа',
      meta: { className: styles.hideOnMobile },
      cell: (info) => <span className={styles.orderNumber}>#{info.getValue<string | number>()}</span>,
    },
    {
      header: 'Клиент',
      cell: ({ row }) => (
        <div className={styles.clientInfo}>
          <div className={styles.clientName}>{row.original.user?.name}</div>
          <div className={styles.clientMeta}>{row.original.user?.email}</div>
          <div className={styles.clientMeta}>{row.original.user?.phone}</div>
        </div>
      )
    },
    {
      header: 'Товары',
      cell: ({ row }) => (
        <div className={styles.itemsList}>
          {row.original.items.map((item: OrderItem) => (
            <div key={item.id}>
              • {item.motorcycle.model} ({item.quantity} шт.)
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Оплата / Итого',
      meta: { className: styles.hideOnTablet },
      cell: ({ row }) => {
        const isSucceeded = row.original.paymentStatus === 'succeeded';
        const paymentStatusClass = isSucceeded ? styles.statusSucceeded : styles.statusFailed;

        return (
          <div>
            <div className={paymentStatusClass}>
              {row.original.paymentStatus}
            </div>
            <div className={styles.totalPrice}>{row.original.totalPrice.toLocaleString()} ₽</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Статус заказа',
      cell: ({ row, getValue }) => {
        const isRestricted = userRole === 'CONTENT_EDITOR' || userRole === 'USER' || userRole === 'MANAGER';
        return (
          <Select
            id="order-single-status"
            label="Изменение статуса заказа"
            options={STATUS_SINGLE_OPTIONS}
            value={String(getValue())}
            title={String(getValue())}
            data-status={String(getValue())}
            onChange={(e) => onStatusChange(row.original.id, e.target.value as OrderStatusUp)}
            variant="dark"
            direction="column"
            disabled={isRestricted}
            visuallyHidden
          />
        )
      }
    },
    {
      header: 'Даты',
      meta: { className: styles.hideOnLaptopS },
      cell: ({ row }) => (
        <div className={styles.datesBlock}>
          <div>Создан: {format(new Date(row.original.createdAt), 'dd.MM.yy HH:mm')}</div>
          <div className={styles.deliveryDate}>
            Доставка: {format(new Date(row.original.estimatedDate), 'dd.MM.yy')}
          </div>
        </div>
      )
    }
  ];
