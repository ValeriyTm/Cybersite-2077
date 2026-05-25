//Роутинг:
import { Link } from "react-router";
//Компоненты:
import { Button } from "@/shared/ui";
//Стили:
import styles from "./SupportTicketsCard.module.scss";

export const SupportTicketsCard = () => {
	return (
		<div className={styles.ticketsZone}>
			<h2>Вопросы поддержке</h2>
			<Link to="/support/tickets">
				<Button type="button" variant="secondary">
					Перейти в мои тикеты
				</Button>
			</Link>
		</div>
	);
};