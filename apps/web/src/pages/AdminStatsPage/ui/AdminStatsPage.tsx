//Состояния:
import { useMutation } from '@tanstack/react-query';
//API:
import { $api } from '@/shared/api/api';
//Иконки:
import { FaSync } from 'react-icons/fa';
//Уведомления:
import toast from 'react-hot-toast';
//Стили:
import styles from './AdminStatsPage.module.scss';

export const AdminStatsPage = () => {
	const syncMutation = useMutation({
		mutationFn: () => $api.post('/admin/sync-search/global'),
		onMutate: () => {
			toast.loading('Запущена полная переиндексация...', { id: 'sync' });
		},
		onSuccess: () => {
			toast.success('Поиск полностью синхронизирован!', { id: 'sync' });
		},
		onError: () => {
			toast.error('Ошибка при синхронизации', { id: 'sync' });
		}
	});

	return (
		<div className={styles.pageWrapper}>
			<h3>Техническое обслуживание</h3>

			<div className={styles.card}>
				<div className={styles.cardInfo}>
					<h4>Глобальная синхронизация поиска</h4>
					<p>Удаляет текущие данные из поискового движка (Elasticsearch) и по-новому заполняет данными из основной базы данных (PostgreSQL). Используйте, если поиск работает некорректно.</p>
				</div>

				<button
					className={styles.syncBtn}
					onClick={() => {
						if (confirm('Это действие удалит индекс поиска и пересоздаст его. Продолжить?')) {
							syncMutation.mutate();
						}
					}}
					disabled={syncMutation.isPending}
				>
					<FaSync className={syncMutation.isPending ? styles.spin : ''} />
					{syncMutation.isPending ? 'Синхронизация...' : 'Запустить переиндексацию'}
				</button>
			</div>
		</div>
	);
};
