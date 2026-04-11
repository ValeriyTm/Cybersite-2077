import { type ColumnDef } from '@tanstack/react-table';
import { FaReply, FaPaperclip } from 'react-icons/fa';
import styles from '../ui/AdminTicketsPage.module.scss';

/**
 * Генерирует колонки для таблицы тикетов.
 * @param onStatusChange - функция для смены статуса (вызывает statusMutation)
 * @param onReply - функция для открытия модалки ответа
 */
export const getTicketColumns = (
    onStatusChange: (id: string, status: string) => void,
    onReply: (ticket: any) => void
): ColumnDef<any>[] => [
        {
            header: 'Отправитель',
            cell: ({ row }) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>
                        {row.original.firstName} {row.original.lastName}
                    </div>
                    <div style={{ color: '#666' }}>{row.original.email}</div>
                    <div style={{ color: '#555', fontSize: '0.8rem' }}>{row.original.phone || '—'}</div>
                </div>
            )
        },
        {
            accessorKey: 'category',
            header: 'Категория',
            cell: (info) => (
                <span style={{
                    fontSize: '0.75rem',
                    background: '#222',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: '#f39c12',
                    border: '1px solid #333'
                }}>
                    {String(info.getValue())}
                </span>
            )
        },
        {
            accessorKey: 'description',
            header: 'Сообщение',
            cell: ({ row }) => (
                <div style={{ maxWidth: '250px' }}>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#ccc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {row.original.description}
                    </div>
                    {/* Иконка вложений, если они есть */}
                    {row.original.attachments?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', color: '#f39c12', fontSize: '0.75rem' }}>
                            <FaPaperclip size={10} />
                            <span>{row.original.attachments.length} файл(ов)</span>
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

                // Цвета для текста статуса
                const statusColors: Record<string, string> = {
                    OPEN: '#e74c3c',
                    IN_PROGRESS: '#3498db',
                    RESOLVED: '#2ecc71',
                    CLOSED: '#555'
                };

                return (
                    <select
                        value={status}
                        className={styles.statusSelect}
                        style={{ color: statusColors[status] || '#fff' }}
                        onChange={(e) => onStatusChange(row.original.id, e.target.value)}
                    >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <FaReply
                        cursor="pointer"
                        color="#f39c12"
                        size={18}
                        title="Ответить на тикет"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReply(row.original);
                        }}
                        style={{ transition: '0.2s', opacity: row.original.status === 'RESOLVED' ? 0.3 : 1 }}
                    />
                </div>
            )
        }
    ];
