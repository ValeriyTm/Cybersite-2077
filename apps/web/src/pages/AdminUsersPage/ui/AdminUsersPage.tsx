//Состояния:
import { useProfile } from "@/features/auth/model/useProfile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
//Формирование таблицы:
import { getUserColumns } from "../model/columns";
import { DataTable } from "@/shared/ui/DataTable/DataTable";
//API:
import { $api } from "@/shared/api/api";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from './AdminUsersPage.module.scss'

export const AdminUsersPage = () => {
	const [role, setRole] = useState('');
	const [email, setEmail] = useState('');
	const { user: currentUser } = useProfile();
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
		(id) => deleteMutation.mutate(id)
	);


	return (
		<div className={styles.pageWrapper}>
			<header className={styles.filterBar}>
				<label htmlFor="email-search-for-users" className='visually-hidden'>Поиск пользовател по email</label>
				<input id='email-search-for-users' type='search' placeholder="Поиск по email..." onChange={(e) => setEmail(e.target.value)} />

				<label htmlFor="user-role" className='visually-hidden'>Выбор роли для пользователя</label>
				<select onChange={(e) => setRole(e.target.value)} id='user-role'>
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
