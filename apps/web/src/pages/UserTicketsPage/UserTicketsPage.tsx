//Состояния:
import { useQuery } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//SEO:
//Типы:
import type { Ticket } from "@/entities/support/types/types";
import { Helmet } from "react-helmet-async";
//Стили:
import styles from "./UserTicketsPage.module.scss";

export const UserTicketsPage = () => {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => $api.get("/support/my-tickets").then((res) => res.data),
  });


  function convertToRussian(status: string) {
    let textStatus;
    switch (status) {
      case 'OPEN':
        textStatus = 'Ожидает';
        break;
      case 'IN_PROGRESS':
        textStatus = 'В работе';
        break;
      case 'RESOLVED':
        textStatus = 'Получен ответ';
        break;
      case 'CLOSED':
        textStatus = 'Отменен';
        break;
    }
    return textStatus;
  }



  if (isLoading) return <div>Загрузка...</div>;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Мои тикеты</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className={styles.container}>
        <h1>Мои обращения</h1>
        <div className={styles.list}>
          {tickets?.map((ticket: Ticket) => (
            <div key={ticket.id} className={styles.ticketCard}>
              <div className={styles.header}>
                <span className={styles.category}>{ticket.category}</span>
                <span className={`${styles.status} ${styles[ticket.status]}`}>
                  {convertToRussian(ticket.status)}
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
                  <strong>Ответ поддержки:</strong>
                  {ticket.answer ? (
                    <span> {ticket.answer}</span>
                  ) : (
                    <span className={styles.waiting}> ждем ответа...</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
