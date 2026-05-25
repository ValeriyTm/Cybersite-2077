//Роутинг:
import { Link } from "react-router";
//Компоненты:
import { Button } from "@/shared/ui";
//Стили:
import styles from "./SupportTicketsCard.module.scss";

export const SupportTicketsCard = () => {
	return (
		<div className={styles.ticketsZone}>
			<h3>Вопросы поддержке</h3>
			<Link to="/support/tickets">
				<Button type="button" variant="outline-dark">
					Перейти в мои тикеты
				</Button>
			</Link>
		</div>
	);
};