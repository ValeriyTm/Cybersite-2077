import { useProfile } from "@/features/auth/model/useProfile";
import { $api } from "@/shared/api/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getUserColumns } from "../model/columns";
import styles from './AdminUsersPage.module.scss'
import { DataTable } from "@/shared/ui/DataTable/DataTable";

export const AdminUsersPage = () => {
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const { user: currentUser } = useProfile(); // Твой стор для получения ID текущего админа
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ['admin-users', role, email],
        queryFn: () => $api.get('/admin/users', { params: { role, email } }).then(res => res.data)
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }: any) => $api.patch(`/admin/users/${id}/role`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Роль обновлена');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => $api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Пользователь удален');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка при удалении')
    });

    const columns = getUserColumns(
        currentUser?.id,
        (id, role) => roleMutation.mutate({ id, role }),
        (id) => deleteMutation.mutate(id) // 🎯 Передаем функцию удаления
    );


    return (
        <div className={styles.pageWrapper}>
            <header className={styles.filterBar}>
                <input placeholder="Поиск по email..." onChange={(e) => setEmail(e.target.value)} />
                <select onChange={(e) => setRole(e.target.value)}>
                    <option value="">Все роли</option>
                    <option value="USER">USER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
            </header>

            <DataTable columns={columns} data={data?.data || []} />
        </div>
    );
};
