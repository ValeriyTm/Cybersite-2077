import { type ColumnDef } from '@tanstack/react-table';
import { FaReply, FaPaperclip } from 'react-icons/fa';

export const ticketColumns = (onReply: (ticket: any) => void): ColumnDef<any>[] => [
    {
        header: 'Отправитель',
        cell: ({ row }) => (
            <div style={{ fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>
                    {row.original.firstName} {row.original.lastName}
                </div>
                <div style={{ color: '#666' }}>{row.original.email}</div>
                <div style={{ color: '#666' }}>{row.original.phone || '—'}</div>
            </div>
        )
    },
    {
        accessorKey: 'category',
        header: 'Категория',
        cell: (info) => <span className={`badge-${String(info.getValue()).toLowerCase()}`}>{String(info.getValue())}</span>
    },
    {
        accessorKey: 'description',
        header: 'Сообщение',
        cell: ({ row }) => (
            <div style={{ maxWidth: '250px', fontSize: '0.85rem', color: '#ccc' }}>
                {row.original.description}
                {/* Если есть вложения — показываем иконку клипсы */}
                {row.original.attachments?.length > 0 && (
                    <div style={{ color: '#f39c12', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaPaperclip size={12} /> {row.original.attachments.length} файл(ов)
                    </div>
                )}
            </div>
        )
    },
    {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ getValue }) => {
            const status = String(getValue());
            const colors: any = { OPEN: '#e74c3c', RESOLVED: '#2ecc71', IN_PROGRESS: '#3498db' };
            return <span style={{ color: colors[status] || '#555', fontWeight: 'bold' }}>{status}</span>;
        }
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            row.original.status === 'OPEN' && (
                <FaReply cursor="pointer" color="#f39c12" onClick={() => onReply(row.original)} title="Ответить" />
            )
        )
    }
];
