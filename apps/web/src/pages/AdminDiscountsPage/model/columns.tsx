//Типы:
import { type ColumnDef } from '@tanstack/react-table';
//Работа с датами:
import { format } from 'date-fns';
//Стили:
import styles from './columns.module.scss';

interface PromoType {
    code: string;
    discountAmount: number;
    usedCount: number;
    expiresAt: string;
}

interface PersonalDiscountType {
    user: {
        email: string;
    };
    motorcycle: {
        model: string;
    };
    discountPercent: number;
    expiresAt: string;
}

export const promoColumns: ColumnDef<PromoType>[] = [
    { accessorKey: 'code', header: 'Промокод', cell: (info) => <code className={styles.promoCode}>{String(info.getValue())}</code> },
    { accessorKey: 'discountAmount', header: 'Скидка (₽)', cell: (info) => `${info.getValue()} ₽` },
    { accessorKey: 'usedCount', header: 'Использовано', meta: { className: styles.hideOnMobile }, },
    { accessorKey: 'expiresAt', header: 'Истекает', cell: (info) => format(new Date(String(info.getValue())), 'dd.MM.yy') },
];

export const personalColumns: ColumnDef<PersonalDiscountType>[] = [
    { header: 'Клиент', meta: { className: styles.client }, cell: ({ row }) => row.original.user?.email },
    { header: 'Мотоцикл', cell: ({ row }) => row.original.motorcycle?.model },
    { accessorKey: 'discountPercent', header: 'Скидка', meta: { className: styles.hideOnMobile }, cell: (info) => `${info.getValue()}%` },
    { accessorKey: 'expiresAt', header: 'До', meta: { className: styles.hideOnMobileS }, cell: (info) => format(new Date(String(info.getValue())), 'dd.MM.yy') },
];
