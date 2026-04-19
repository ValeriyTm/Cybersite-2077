import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import styles from './columns.module.scss';

export const promoColumns: ColumnDef<any>[] = [
    { accessorKey: 'code', header: 'Промокод', cell: (info) => <code style={{ color: '#f1c40f' }}>{String(info.getValue())}</code> },
    { accessorKey: 'discountAmount', header: 'Скидка (₽)', cell: (info) => `${info.getValue()} ₽` },
    { accessorKey: 'usedCount', header: 'Использовано', meta: { className: styles.hideOnMobile }, },
    { accessorKey: 'expiresAt', header: 'Истекает', cell: (info) => format(new Date(String(info.getValue())), 'dd.MM.yy') },
];

export const personalColumns: ColumnDef<any>[] = [
    { header: 'Клиент', cell: ({ row }) => row.original.user?.email },
    { header: 'Мотоцикл', cell: ({ row }) => row.original.motorcycle?.model },
    { accessorKey: 'discountPercent', header: 'Скидка', meta: { className: styles.hideOnMobile }, cell: (info) => `${info.getValue()}%` },
    { accessorKey: 'expiresAt', header: 'До', cell: (info) => format(new Date(String(info.getValue())), 'dd.MM.yy') },
];
