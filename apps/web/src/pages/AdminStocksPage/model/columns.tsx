//Типы:
import { type ColumnDef } from '@tanstack/react-table';
//Компоненты:
import { AdminButton } from '@/shared/ui';
//Типы
import type { Stock } from '@/entities/admin/types/types';
//Стили:
import styles from './columns.module.scss';

export const stockColumns = (onEdit: (stock: Stock) => void): ColumnDef<Stock>[] => [
  {
    header: 'Мотоцикл',
    cell: ({ row }) => (
      <div>
        <div className={styles.motorcycleModel}>{row.original.motorcycle?.model}</div>
      </div>
    )
  },
  {
    header: 'Склад / Город',
    cell: ({ row }) => (
      <div>
        <span>{row.original.warehouse?.name}</span>
        <span className={styles.warehouseCity}>({row.original.warehouse?.city})</span>
      </div>
    )
  },
  {
    accessorKey: 'quantity',
    header: 'В наличии',
    cell: ({ getValue }) => {
      const val = Number(getValue());

      // Определяем класс в зависимости от количества
      let quantityClass = styles.quantityHigh;
      if (val < 3) {
        quantityClass = styles.quantityLow;
      } else if (val < 10) {
        quantityClass = styles.quantityMedium;
      }

      return <strong className={quantityClass}>{val} шт.</strong>;
    }
  },
  {
    accessorKey: 'reserved',
    header: 'Резерв',
    cell: (info) => <span className={styles.reservedCount}>{String(info.getValue())} шт.</span>
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <AdminButton
        variant="edit"
        title={`Редактировать остатки для ${row.original.motorcycle?.model}`}
        onClick={() => onEdit(row.original)}
      />
    )
  }
];
