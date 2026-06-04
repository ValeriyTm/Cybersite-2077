//Типы:
import { type ColumnDef } from '@tanstack/react-table';
//Работа с датами:
import { format } from 'date-fns';
//Компоненты:
import { AdminButton } from '@/shared/ui';
//Типы:
import type { News } from '@/entities/content';
//Стили:
import styles from './columns.module.scss';


export const newsColumns = (
  onEdit: (item: News) => void,
  onDelete: (id: string) => void,
  onStatusUpdate: (id: string, status: string) => void
): ColumnDef<News>[] => [
    {
      accessorKey: 'title',
      header: 'Заголовок',
      meta: { className: styles.titleColumn },
      cell: ({ row }) => (
        <div className={styles.title}>{row.original.title}</div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      meta: { className: styles.statusColumn },
      cell: ({ row, getValue }) => {
        const status = String(getValue());
        const selectClass = `${styles.statusSelect} ${status === 'PUBLISHED' ? styles.published : styles.draft
          }`;

        return (
          <>
            <label htmlFor="news-status" className="visually-hidden">
              Выбор статуса для новости
            </label>
            <select
              id="news-status"
              value={status}
              onChange={(e) => onStatusUpdate(row.original._id, e.target.value)}
              className={selectClass}
            >
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликовано</option>
            </select>
          </>
        );
      }
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
      meta: { className: styles.actionsColumn },
      cell: ({ row }) => (
        <div className={styles.actions}>
          <AdminButton
            variant="edit"
            title={`Редактировать новость ${row.original.title}`}
            onClick={() => onEdit(row.original)}
          />
          <AdminButton
            variant="delete"
            title={`Удалить новость ${row.original.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.original._id);
            }}
          />
        </div>
      )
    }
  ];