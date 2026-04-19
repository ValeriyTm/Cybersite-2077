import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns'; // Для красивых дат
import styles from './columns.module.scss'

export const getOrderColumns = (
    onStatusChange: (id: string, newStatus: string) => void,
    userRole: string | undefined): ColumnDef<any>[] => [
        {
            accessorKey: 'orderNumber',
            header: '№ Заказа',
            meta: { className: styles.hideOnMobile },
            cell: (info) => <span style={{ fontWeight: 'bold' }}>#{info.getValue()}</span>,
        },
        {
            header: 'Клиент',
            cell: ({ row }) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div>{row.original.user?.name}</div>
                    <div style={{ color: '#666' }}>{row.original.user?.email}</div>
                    <div style={{ color: '#666' }}>{row.original.user?.phone}</div>
                </div>
            )
        },
        {
            header: 'Товары',
            cell: ({ row }) => (
                <div style={{ fontSize: '0.8rem' }}>
                    {row.original.items.map((item: any) => (
                        <div key={item.id}>
                            • {item.motorcycle.model} ({item.quantity} шт.)
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'Оплата / Итого',
            meta: { className: styles.hideOnMobileS },
            cell: ({ row }) => (
                <div>
                    <div style={{ color: row.original.paymentStatus === 'succeeded' ? '#2ecc71' : '#e74c3c' }}>
                        {row.original.paymentStatus}
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{row.original.totalPrice.toLocaleString()} ₽</div>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Статус заказа',
            cell: ({ row, getValue }) => {
                const isRestricted = userRole === 'CONTENT_EDITOR' || userRole === 'USER' || userRole === 'MANAGER';
                return (
                    <select
                        value={String(getValue())}
                        className={styles.statusSelect}
                        disabled={isRestricted}
                        onChange={(e) => onStatusChange(row.original.id, e.target.value)}
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="CANCELED">CANCELED</option>
                        <option value="DELIVERY">DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="COMPLETED">COMPLETED</option>
                    </select>

                )
            }
        },
        {
            header: 'Даты',
            meta: { className: styles.hideOnMobile },
            cell: ({ row }) => (
                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                    <div>Создан: {format(new Date(row.original.createdAt), 'dd.MM.yy HH:mm')}</div>
                    <div style={{ color: '#f39c12' }}>
                        Доставка: {format(new Date(row.original.estimatedDate), 'dd.MM.yy')}
                    </div>
                </div>
            )
        }
    ];
