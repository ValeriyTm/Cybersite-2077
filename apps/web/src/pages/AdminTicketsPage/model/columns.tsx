import { type ColumnDef } from '@tanstack/react-table';
import { FaReply, FaPaperclip } from 'react-icons/fa';
//Стили:
import styles from './columns.module.scss';

/**
 * Генерирует колонки для таблицы тикетов.
 * @param onStatusChange - функция для смены статуса (вызывает statusMutation)
 * @param onReply - функция для открытия модалки ответа
 */

const CATEGORY_LABELS: Record<string, string> = {
  COOPERATION: 'Сотрудничество',
  COMPLAINT: 'Жалоба',
  ORDER: 'Заказ',
  TECHNICAL: 'Технический вопрос',
  OTHER: 'Другое'
};

export const getTicketColumns = (
  onStatusChange: (id: string, status: string) => void,
  onReply: (ticket: any) => void
): ColumnDef<any>[] => [
    {
      accessorKey: 'sender',
      header: 'Отправитель',
      cell: ({ row }) => (
        <div className={styles.senderCell}>
          <div className={styles.userName}>
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className={styles.userEmail}>{row.original.email}</div>
          <div className={`${styles.userPhone} ${styles.hideOnMobile}`}>
            {row.original.phone || '—'}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Категория',
      meta: { className: styles.hideOnMobile }, //Скроем всю колонку на мобилках
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
          <>
            <label htmlFor="ticket-status" className='visually-hidden'>Изменение статуса тикета</label>
            <select
              id='ticket-status'
              value={status}
              className={styles.statusSelect}
              data-status={status}
              onChange={(e) => onStatusChange(row.original.id, e.target.value)}
            >
              <option value="OPEN">Открыт</option>
              <option value="IN_PROGRESS">В процессе</option>
              <option value="RESOLVED">Решен</option>
              <option value="CLOSED">Отменен</option>
            </select>
          </>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className={styles.actionsCell}>
          <button
            type="button"
            //@ts-ignore:
            cursor="pointer"
            title={`Ответить на тикет от ${row.original.email}`}
            className={styles.replyBtn}
            data-resolved={row.original.status === 'RESOLVED'}
            onClick={(e) => {
              e.stopPropagation();
              onReply(row.original);
            }}
          >
            <FaReply />
          </button>
        </div>
      )
    }
  ];