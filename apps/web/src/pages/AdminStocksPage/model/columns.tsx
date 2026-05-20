
//Типы:
import { type ColumnDef } from '@tanstack/react-table';
//Иконки:
import { FaEdit } from 'react-icons/fa';
//Типы
import type { Stock } from '@/entities/admin/types/types';
//Стили:
import styles from './columns.module.scss';

export const stockColumns = (onEdit: (stock: Stock) => void): ColumnDef<Stock>[] => [
  {
    header: 'Мотоцикл',
    cell: ({ row }) => (
      <div>
        <div style={{ color: '#fff' }}>{row.original.motorcycle?.model}</div>
      </div>
    )
  },
  {
    header: 'Склад / Город',
    cell: ({ row }) => (
      <div>
        <span>{row.original.warehouse?.name}</span>
        <span style={{ color: '#555', marginLeft: '8px' }}>({row.original.warehouse?.city})</span>
      </div>
    )
  },
  {
    accessorKey: 'quantity',
    header: 'В наличии',
    cell: ({ getValue }) => {
      const val = Number(getValue());
      let color;
      if (val < 3) {
        color = '#e74c3c';
      } else if (val < 10) {
        color = '#f39c12';
      } else {
        color = '#2ecc71';
      }
      return <strong style={{ color }}>{val} шт.</strong>;
    }
  },
  {
    accessorKey: 'reserved',
    header: 'Резерв',
    cell: (info) => <span style={{ color: '#555' }}>{String(info.getValue())} шт.</span>
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <button
        type="button"
        style={{ cursor: 'pointer' }}
        title={`Редактировать остатки для ${row.original.motorcycle?.model}`}
        className={`${styles.editBtn}`}
        onClick={() => onEdit(row.original)}
      >
        <FaEdit />
      </button>

    )
  }
];
