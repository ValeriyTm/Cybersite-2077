
//Типы:
import { type ColumnDef } from '@tanstack/react-table';
//Иконки:
import { FaEdit } from 'react-icons/fa';
//Стили:
import styles from './columns.module.scss';

export const stockColumns = (onEdit: (stock: any) => void): ColumnDef<any>[] => [
  {
    header: 'Мотоцикл',
    cell: ({ row }) => (
      <div>
        <div style={{ color: '#fff' }}>{row.original.motorcycle?.model}</div>
        <div style={{ fontSize: '0.7rem', color: '#666' }}>{row.original.motorcycle?.brand?.name}</div>
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
      const color = val < 3 ? '#e74c3c' : val < 10 ? '#f39c12' : '#2ecc71';
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
        //@ts-ignore:
        cursor="pointer"
        title={`Редактировать остатки для ${row.original.motorcycle?.model}`}
        className={`${styles.editBtn}`}
        onClick={() => onEdit(row.original)}
      >
        <FaEdit />
      </button>

    )
  }
];
