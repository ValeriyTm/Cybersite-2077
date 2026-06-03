import { type ColumnDef } from '@tanstack/react-table';
//Компоненты:
import { AdminButton, Select } from '@/shared/ui';
//Иконки:
import { FaPaperclip } from 'react-icons/fa';
//Типы:
import type { Ticket } from '@/entities/support/types/types';
//Стили:
import styles from './columns.module.scss';

const CATEGORY_LABELS: Record<string, string> = {
  COOPERATION: 'Сотрудничество',
  COMPLAINT: 'Жалоба',
  ORDER: 'Заказ',
  TECHNICAL: 'Технический вопрос',
  OTHER: 'Другое'
};

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Открыт" },
  { value: "IN_PROGRESS", label: "В процессе" },
  { value: "RESOLVED", label: "Решен" },
  { value: "CLOSED", label: "Отменен" },
];

export const getTicketColumns = (
  onStatusChange: (id: string, status: string) => void,
  onReply: (ticket: Ticket) => void,
  isRestricted: boolean,
): ColumnDef<Ticket>[] => [
    {
      accessorKey: 'sender',
      header: 'Отправитель',
      cell: ({ row }) => (
        <div className={styles.senderCell}>
          <div className={styles.userName}>
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className={styles.userEmail}>{row.original.email}</div>
          <div className={`${styles.userPhone} ${styles.hideOnTablet}`}>
            {row.original.phone || '—'}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Категория',
      meta: { className: styles.hideOnTablet },
      cell: (info) => (
        <span className={styles.categoryBadge}>
          {CATEGORY_LABELS[String(info.getValue())] || String(info.getValue())}
        </span>
      )
    },
    {
      accessorKey: 'description',
      header: 'Сообщение',
      meta: { className: styles.hideOnMobile },
      cell: ({ row }) => (
        <div className={styles.descriptionWrapper}>
          <div className={styles.descriptionText}>
            {row.original.description}
          </div>
          {row.original.attachments?.length > 0 && (
            <div className={styles.attachments}>
              <FaPaperclip size={10} />
              <span>{row.original.attachments.length}</span>
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row, getValue }) => {
        const status = String(getValue());
        return (
          <Select
            id="status-select"
            label="Изменение статуса тикета:"
            options={STATUS_OPTIONS}
            value={status}
            data-status={status}
            onChange={!isRestricted ? (e) => onStatusChange(row.original.id, e.target.value) : undefined}
            variant="dark"
            direction="column"
            visuallyHidden
          />
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className={styles.actionsCell}>
          <AdminButton
            type="button"
            variant="reply"
            title={`Ответить на тикет от ${row.original.email}`}
            data-resolved={row.original.status === 'RESOLVED'}
            onClick={(e) => {
              e.stopPropagation();
              onReply(row.original);
            }} />
        </div>
      )
    }
  ];