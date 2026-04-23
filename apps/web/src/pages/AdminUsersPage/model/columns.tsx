import { type ColumnDef } from '@tanstack/react-table';
import { FaTrash } from 'react-icons/fa';
import styles from './columns.module.scss';

export const getUserColumns = (
    currentAdminId: string | undefined,
    onRoleChange: (id: string, role: string) => void,
    onDelete: (id: string) => void
): ColumnDef<any>[] => [
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'name', header: 'Имя', meta: { className: styles.hideOnMobile }, },
        { accessorKey: 'phone', header: 'Телефон', meta: { className: styles.hideOnMobile }, cell: (info) => info.getValue() || '—' },
        {
            accessorKey: 'isActivated',
            header: 'Статус',
            meta: { className: styles.hideOnMobile },
            cell: (info) => (
                <span style={{ color: info.getValue() ? '#2ecc71' : '#e74c3c' }}>
                    {info.getValue() ? 'Подтвержден' : 'Не подтвержден'}
                </span>
            )
        },
        {
            accessorKey: 'role',
            header: 'Роль',
            cell: ({ row, getValue }) => {
                const userId = row.original.id;
                const isSelf = userId === currentAdminId;

                return (
                    <>
                        <label htmlFor="user-status" className='visually-hidden'>Указание роли пользователю</label>
                        <select
                            id='user-status'
                            value={String(getValue())}
                            disabled={isSelf} //Блокируем выбор для себя
                            style={{ opacity: isSelf ? 0.5 : 1 }}
                            onChange={(e) => onRoleChange(userId, e.target.value)}
                            className={styles.statusSelect}
                        >
                            <option value="USER">USER</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                    </>
                );
            }
        },
        {
            id: 'actions',
            header: 'Действия',
            cell: ({ row }) => {
                const isSelf = row.original.id === currentAdminId;
                return (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {!isSelf && (
                            <button
                                type="button"
                                cursor="pointer"
                                title={`Удалить пользователя ${row.original.email}`}
                                className={`${styles.deleteBtn}`}
                                onClick={() => {
                                    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${row.original.email}? Это действие необратимо.`)) {
                                        onDelete(row.original.id);
                                    }
                                }}
                            >
                                <FaTrash />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];
