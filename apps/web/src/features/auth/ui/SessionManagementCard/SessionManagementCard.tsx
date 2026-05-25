//Компоненты:
import { Button } from "@/shared/ui";
//Стили:
import styles from "./SessionManagementCard.module.scss";

interface SessionManagementProps {
	onLogout: () => Promise<void> | void;
	onLogoutAll: () => Promise<void> | void;
}

export const SessionManagementCard = ({ onLogout, onLogoutAll }: SessionManagementProps) => {
	return (
		<div className={styles.sessionZone}>
			<h2>Управление сессиями</h2>
			<div className={styles.btnGroup}>
				<Button type="button" variant="secondary" onClick={onLogout}>
					Выйти из аккаунта
				</Button>
				<Button type="button" variant="danger" onClick={onLogoutAll}>
					Выйти со всех устройств
				</Button>
			</div>
		</div>
	);
};