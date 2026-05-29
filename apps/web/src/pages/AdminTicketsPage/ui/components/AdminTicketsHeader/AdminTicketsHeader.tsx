//Компоненты:
import { Input, Select } from '@/shared/ui';
//Категории:
import { TICKET_STATUS_OPTIONS } from '../../../model/items';
//Стили:
import styles from './AdminTicketsHeader.module.scss';

interface AdminTicketsHeaderProps {
  emailValue: string;
  onChangeEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusFilter: string;
  onChangeStatus: (value: string) => void;
}

export const AdminTicketsHeader = ({
  emailValue,
  onChangeEmail,
  statusFilter,
  onChangeStatus,
}: AdminTicketsHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <h3>Поддержка пользователей</h3>
        <p>Обработка входящих тикетов и вопросов</p>
      </div>
      <div className={styles.filters}>
        <Input
          id="email-search-for-tickets"
          placeholder="🔍 Поиск по email..."
          label="Поиск тикета по email"
          title="Поиск тикета по email"
          type="search"
          value={emailValue}
          onChange={onChangeEmail}
          variant="dark-full"
          visuallyHidden
        />

        <Select
          id="tickets-status-select"
          label="Фильтрация тикета по статусу"
          options={TICKET_STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => onChangeStatus(e.target.value)}
          variant="dark"
          direction="column"
          visuallyHidden
        />
      </div>
    </header>
  );
};
