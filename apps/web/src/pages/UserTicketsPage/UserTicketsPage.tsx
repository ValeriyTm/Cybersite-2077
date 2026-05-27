//Компоненты:
import { TicketCard, useTickets } from "@/entities/support";
//Типы:
import type { Ticket } from "@/entities/support";
import { Helmet } from "react-helmet-async";
//Стили:
import styles from "./UserTicketsPage.module.scss";

export const UserTicketsPage = () => {
  //Получаем тикеты:
  const { data: tickets, isLoading } = useTickets();

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
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>
    </>
  );
};
