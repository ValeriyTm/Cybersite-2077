//Типы:
import { type ColumnDef } from '@tanstack/react-table';
//Работа с датами:
import { format } from 'date-fns';
//Типы:
import type { News } from '@/entities/content';
//Иконки:
import { FaEdit, FaTrash } from 'react-icons/fa';
//Стили:
import styles from './columns.module.scss';
import { AdminButton } from '@/shared/ui';


export const newsColumns = (onEdit: (item: News) => void,
  onDelete: (id: string) => void,
  onStatusUpdate: (id: string, status: string) => void): ColumnDef<News>[] => [
    {
      accessorKey: 'title',
      header: 'Заголовок',
      cell: ({ row }) => (
        <div style={{ fontWeight: 'bold', color: '#fff' }}>{row.original.title}</div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row, getValue }) => (
        <>
          <label htmlFor="news-status" className='visually-hidden'>Выбор статуса для новости</label>
          <select
            id='news-status'
            value={String(getValue())}
            onChange={(e) => onStatusUpdate(row.original._id, e.target.value)}
            style={{
              color: getValue() === 'PUBLISHED' ? '#2ecc71' : '#f39c12',
              background: 'transparent',
              /* pxtorem-disable-next-line */
              border: '1px solid #333',
              borderRadius: '4px'
            }}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Дата',
      meta: { className: styles.hideOnMobile },
      cell: (info) => format(new Date(String(info.getValue())), 'dd.MM.yyyy')
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '15px', color: '#f39c12' }}>
          <AdminButton variant="edit" title={`Редактировать новость ${row.original.title}`} onClick={() => onEdit(row.original)} />

          <AdminButton variant="delete" title={`Удалить новость ${row.original.title}`} onClick={(e) => {
            e.stopPropagation();
            onDelete(row.original._id);
          }} />
        </div>
      )
    }
  ];
