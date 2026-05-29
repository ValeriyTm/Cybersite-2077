//Состояния:
import { useState, useMemo } from "react";
import { useProfile } from "@/features/auth";
import { useAdminUsers } from "@/entities/admin";
import { useAdminUsersDelete, useAdminUsersStatus } from "@/features/admin";
//Формирование таблицы:
import { getUserColumns } from "../model/columns";
import { ActionConfirmModal, DataTable, Input, Select } from "@/shared/ui";
//Категории:
import { ROLE_OPTIONS } from "../model/items";
//Дебаунс поиска:
import { debounce } from 'lodash';
//Типы:
import type { Role } from "@repo/database/generated/prisma/client";
//Стили:
import styles from './AdminUsersPage.module.scss'

export const AdminUsersPage = () => {
	const [role, setRole] = useState<Role | ''>('');
	const [emailSearch, setEmailSearch] = useState('');
	const [debouncedEmail, setDebouncedEmail] = useState('');
	const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

	const { user: currentUser } = useProfile();

	//Получаем данные о юзерах:
	const { data } = useAdminUsers(role, debouncedEmail);
	//Мутация изменения роли юзеру:
	const roleMutation = useAdminUsersStatus();
	//Мутация удаления юзера:
	const deleteMutation = useAdminUsersDelete();

	//Обработчик для модалки:
	const handleConfirmDelete = () => {
		if (!userToDelete) return;

		deleteMutation.mutate(userToDelete.id, {
			onSuccess: () => {
				setUserToDelete(null);
			}
		});
	};

	const columns = getUserColumns(
		currentUser!.id,
		(id, role) => roleMutation.mutate({ id, role }),
		(id, email) => setUserToDelete({ id, email })
	);

	//Дебаунс для поиска
	const updateSearch = useMemo(
		() => debounce((val: string) => setDebouncedEmail(val), 500),
		[]
	);

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmailSearch(e.target.value);
		updateSearch(e.target.value);
	};


	return (
		<div className={styles.pageWrapper}>
			<header className={styles.filterBar}>
				<Input
					label="Поиск пользователя по emai"
					id="email-search-for-users"
					title="Поиск пользователя по emai"
					placeholder="Поиск по email..."
					type='search'
					value={emailSearch}
					onChange={handleEmailChange}
					variant="dark"
					visuallyHidden
				/>

				<Select
					id="user-role"
					label="Выбор роли для пользователя"
					options={ROLE_OPTIONS}
					onChange={(e) => setRole(e.target.value as Role)}
					variant="dark"
					direction="column"
					visuallyHidden
				/>
			</header>

			<DataTable columns={columns} data={data?.data || []} />

			<ActionConfirmModal
				isOpen={Boolean(userToDelete)}
				title="Удаление пользователя"
				description={`Вы уверены, что хотите удалить пользователя ${userToDelete?.email}? Это действие необратимо.`}
				variant="danger"
				confirmText="Удалить"
				cancelText="Назад"
				isSubmitting={deleteMutation.isPending}
				onConfirm={handleConfirmDelete}
				onCancel={() => setUserToDelete(null)}
			/>
		</div>
	);
};
