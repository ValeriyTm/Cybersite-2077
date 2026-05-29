//Компоненты:
import { AdminButton, Select } from '@/shared/ui';
//Типы:
import { type ColumnDef } from '@tanstack/react-table';
import type { Role } from '@repo/database/generated/prisma/client';
//Категории:
import { SINGLE_ROLE_OPTIONS } from './items';
//Стили:
import styles from './columns.module.scss';

interface UserData {
  createdAt: string;
  email: string;
  id: string;
  isActivated: boolean;
  name: string;
  phone: string;
  role: Role;
}

export const getUserColumns = (
  currentAdminId: string,
  onRoleChange: (id: string, role: Role) => void,
  onDelete: (id: string, email: string) => void
): ColumnDef<UserData>[] => [
    {
      accessorKey: 'email',
      header: 'Email',
      meta: { className: styles.emailColumn },
    },
    {
      accessorKey: 'name',
      header: 'Имя',
      meta: { className: styles.hideOnMobile },
    },
    {
      accessorKey: 'phone',
      header: 'Телефон',
      meta: { className: styles.hideOnMobile },
      cell: (info) => info.getValue() || '—'
    },
    {
      accessorKey: 'isActivated',
      header: 'Подтвержден',
      meta: { className: styles.hideOnTablet },
      cell: (info) => (
        <div className={styles.centerWrapper}>
          <span className={info.getValue() ? styles.statusActive : styles.statusInactive}>
            {info.getValue() ? '+' : '-'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'role',
      header: 'Роль',
      cell: ({ row, getValue }) => {
        const userId = row.original.id;
        const isSelf = userId === currentAdminId;

        return (
          <Select
            id="user-single-status"
            label="Изменение роли пользователя"
            options={SINGLE_ROLE_OPTIONS}
            value={String(getValue())}
            title={String(getValue())}
            data-status={String(getValue())}
            onChange={(e) => onRoleChange(userId, e.target.value as Role)}
            variant="dark"
            direction="column"
            disabled={isSelf}
            visuallyHidden
          />
        );
      }
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => {
        const isSelf = row.original.id === currentAdminId;

        return (
          <div className={styles.actionsContainer}>
            {!isSelf && (
              <AdminButton
                variant="delete"
                title={`Удалить пользователя ${row.original.email}`}
                onClick={() => {
                  onDelete(row.original.id, row.original.email);
                }}
              />
            )}
          </div>
        );
      }
    }
  ];
