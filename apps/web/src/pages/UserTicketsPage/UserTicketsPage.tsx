//API:
import { $api } from "@/shared/api/api";
//Состояния:
import { useQuery } from "@tanstack/react-query";
//Стили:
import styles from "./UserTicketsPage.module.scss";

export const UserTicketsPage = () => {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => $api.get("/support/my-tickets").then((res) => res.data),
  });

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <h1>Мои обращения</h1>
      <div className={styles.list}>
        {tickets?.map((ticket: any) => (
          <div key={ticket.id} className={styles.ticketCard}>
            <div className={styles.header}>
              <span className={styles.category}>{ticket.category}</span>
              <span className={`${styles.status} ${styles[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>

            <div className={styles.question}>
              <p>
                <strong>Ваш вопрос:</strong> {ticket.description}
              </p>
              <small>{new Date(ticket.createdAt).toLocaleDateString()}</small>
            </div>

            <div className={styles.answer}>
              <p>
                <strong>Ответ поддержки:</strong>
                {ticket.answer ? (
                  <span> {ticket.answer}</span>
                ) : (
                  <p className={styles.waiting}>ждем ответа...</p>
                )}
                {ticket.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
