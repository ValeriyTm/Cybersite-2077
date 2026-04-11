import { type ColumnDef } from '@tanstack/react-table';
import { FaTrash } from 'react-icons/fa';

export const getUserColumns = (
    currentAdminId: string | undefined,
    onRoleChange: (id: string, role: string) => void,
    onDelete: (id: string) => void
): ColumnDef<any>[] => [
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'name', header: 'Имя' },
        { accessorKey: 'phone', header: 'Телефон', cell: (info) => info.getValue() || '—' },
        {
            accessorKey: 'isActivated',
            header: 'Статус',
            cell: (info) => (
                <span style={{ color: info.getValue() ? '#2ecc71' : '#e74c3c' }}>
                    {info.getValue() ? 'Подтвержден' : 'Не подтвержден'}
                </span>
            )
        },
        {
            accessorKey: 'role',
            header: 'Роль в системе',
            cell: ({ row, getValue }) => {
                const userId = row.original.id;
                const isSelf = userId === currentAdminId;

                return (
                    <select
                        value={String(getValue())}
                        disabled={isSelf} //Блокируем выбор для себя
                        style={{ opacity: isSelf ? 0.5 : 1 }}
                        onChange={(e) => onRoleChange(userId, e.target.value)}
                    >
                        <option value="USER">USER</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
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
                            <FaTrash
                                cursor="pointer"
                                color="#e74c3c"
                                title="Удалить пользователя"
                                onClick={() => {
                                    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${row.original.email}? Это действие необратимо.`)) {
                                        onDelete(row.original.id);
                                    }
                                }}
                            />
                        )}
                    </div>
                );
            }
        }

    ];
