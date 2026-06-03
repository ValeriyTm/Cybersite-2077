//Извлечение параметров:
import { useSearchParams } from 'react-router';
//Состояния:
import { useState } from 'react';
import { useAdminStocks } from '@/entities/admin';
import { useAdminStocksSave } from '@/features/admin';
import { useProfile } from '@/features/auth';
//Формирование таблицы:
import { DataTable } from '@/shared/ui';
import { stockColumns } from '../model/columns';
//Компоненты:
import { StockEditModal } from './components';
//Типы:
import type { Stock } from '@/entities/admin/types/types';
//Стили:
import styles from './AdminStocksPage.module.scss';

export const AdminStocksPage = () => {
	const [searchParams] = useSearchParams();
	const motoId = searchParams.get('motoId');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingStock, setEditingStock] = useState<Stock | null>(null);

	const { user } = useProfile(); //Данные юзера
	const userRole = user?.role;

	//Данные об остатках:
	const { data, isLoading } = useAdminStocks(motoId!);

	//Мутация обновления остатков:
	const updateMutation = useAdminStocksSave({ setIsModalOpen, editingStock })

	const columns = stockColumns((stock) => {
		setEditingStock(stock);
		setIsModalOpen(true);
	});

	if (isLoading) return <div>Загрузка...</div>;

	if (!data?.data || data.data.length === 0) {
		return <div className={styles.empty}>Сначала выберите модель мотоцикла на вкладке "Мотоциклы".</div>;
	}

	return (
		<div className={styles.pageWrapper}>
			<h3>
				Запасы модели:
				<span className={styles.modelTitle}>
					{data.data[0]?.motorcycle?.model}
				</span>
			</h3>

			<DataTable columns={columns} data={data.data} />

			{isModalOpen && (
				<StockEditModal
					isOpen={isModalOpen}
					onClose={() => {
						setIsModalOpen(false);
						setEditingStock(null);
					}}
					stock={editingStock}
					role={userRole}
					onSave={(quantity) => updateMutation.mutate(quantity)}
					isSaving={updateMutation.isPending}
				/>
			)}
		</div>
	);
};
