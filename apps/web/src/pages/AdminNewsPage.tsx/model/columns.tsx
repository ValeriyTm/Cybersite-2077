import { type ColumnDef } from '@tanstack/react-table';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import styles from './columns.module.scss';


export const newsColumns = (onEdit: (item: any) => void,
    onDelete: (id: string) => void,
    onStatusUpdate: (id: string, status: string) => void): ColumnDef<any>[] => [
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
                <select
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
                    <FaEdit cursor="pointer" onClick={() => onEdit(row.original)} title="Редактировать" />
                    <FaTrash cursor="pointer" color="#e74c3c" onClick={(e) => {
                        e.stopPropagation();
                        onDelete(row.original._id);
                    }} title="Удалить" />
                </div>
            )
        }
    ];
