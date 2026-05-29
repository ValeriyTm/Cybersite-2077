//Состояния:
import { useMemo, useState } from 'react';
import { useAdminTickets } from '@/entities/admin';
import { useAdminTicketsReply, useAdminTicketsStatus } from '@/features/admin';
//Формирование таблицы:
import { DataTable, Pagination } from '@/shared/ui';
import { getTicketColumns } from '../model/columns';
//Компоненты:
import { AdminTicketModal } from './components';
import { AdminTicketsHeader } from './components/AdminTicketsHeader';
//Дебаунс поиска:
import { debounce } from 'lodash';
//Типы:
import type { Ticket } from '@/entities/support/types/types';
//Стили:
import styles from './AdminTicketsPage.module.scss';


export const AdminTicketsPage = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [page, setPage] = useState(1);
  const [emailValue, setEmailValue] = useState(''); //Для мгновенного ввода
  const [debouncedEmail, setDebouncedEmail] = useState(''); //Для API-запроса
  const [statusFilter, setStatusFilter] = useState('');

  //Получение данных о тикетах:
  const { data, isLoading } = useAdminTickets(page, statusFilter, debouncedEmail);
  //Мутация изменения статуса тикета:
  const statusMutation = useAdminTicketsStatus();
  //Мутация отправки ответа:
  const replyMutation = useAdminTicketsReply({
    selectedTicket,
    setSelectedTicket,
  });

  //Задержка поиска:
  const updateSearch = useMemo(
    () => debounce((val: string) => setDebouncedEmail(val), 500),
    []
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);
    updateSearch(e.target.value);
    setPage(1); //При смене фильтров сбрасываем страницу на первую
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1); // При смене статуса сбрасываем на первую страницу
  };

  //Подготовка колонок:
  const columns = getTicketColumns(
    (id, status) => statusMutation.mutate({ id, status }),
    (ticket) => {
      setSelectedTicket(ticket);
    }
  );

  return (
    <div className={styles.pageWrapper}>
      <AdminTicketsHeader
        emailValue={emailValue}
        onChangeEmail={handleEmailChange}
        statusFilter={statusFilter}
        onChangeStatus={handleStatusChange}
      />

      {/*Лоадер только на таблицу, чтобы при поиске не сбрасывался фокус:*/}
      {isLoading ? (
        <div className={styles.loader}>Загрузка...</div>
      ) : (

        <DataTable columns={columns} data={data?.data || []} />
      )}

      {/*Блок пагинации:*/}
      <Pagination
        currentPage={page}
        totalPages={data?.meta?.lastPage || 1}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/*Модальное окно для ответа на тикет:*/}
      {selectedTicket && (
        <AdminTicketModal
          ticket={selectedTicket}
          isPending={replyMutation.isPending}
          onClose={() => setSelectedTicket(null)}
          onReply={(text, successCallback) => {
            // Передаем текст в мутацию. В onSuccess мутации вызовите successCallback(), чтобы очистить textarea
            replyMutation.mutate({
              answer: text,
              onSuccessCallback: successCallback
            });
          }}
        />
      )}
    </div>
  );
};
