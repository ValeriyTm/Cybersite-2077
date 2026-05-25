import type { Ticket } from "@/entities/support/types/types";
//Мапперы:
import { REASON_RU_MAP, STATUS_RU_MAP } from "../model/statusMappers";
//Стили:
import styles from "./TicketCard.module.scss";


interface TicketCardProps {
  ticket: Ticket;
}

export const TicketCard = ({ ticket }: TicketCardProps) => {
  return (
    <div className={styles.ticketCard}>
      <div className={styles.header}>
        <span className={styles.category}>
          {REASON_RU_MAP[ticket.category] || ticket.category}
        </span>
        <span className={`${styles.status} ${styles[ticket.status]}`}>
          {STATUS_RU_MAP[ticket.status] || ticket.status}
        </span>
      </div>

      <div className={styles.question}>
        <small>{new Date(ticket.createdAt).toLocaleDateString()}</small>
        <p>
          <strong>Ваш вопрос:</strong> {ticket.description}
        </p>
      </div>

      <div className={styles.answer}>
        <p>
          <strong>Ответ поддержки:</strong>{" "}
          {ticket.answer ? (
            <span>{ticket.answer}</span>
          ) : (
            <span className={styles.waiting}>ждем ответа...</span>
          )}
        </p>
      </div>
    </div>
  );
};
