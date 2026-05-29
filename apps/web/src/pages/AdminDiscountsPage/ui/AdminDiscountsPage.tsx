//Состояния:
import { useMemo, useState } from 'react';
import { useProfile } from '@/features/auth';
import { useAdminPersonalDiscounts, useAdminPromos } from '@/entities/admin';
import { useAdminDiscountsGeneration } from '@/features/admin';
//Формирование таблицы:
import { promoColumns, personalColumns } from '../model/columns';
//Компоненты:
import { Button, DataTable, Input } from '@/shared/ui';
//Дебаунс поиска:
import { debounce } from 'lodash';
//Иконки:
import { FaMagic, FaTicketAlt, FaUserTag } from 'react-icons/fa';
//Стили:
import styles from './AdminDiscountsPage.module.scss';

export const AdminDiscountsPage = () => {
  const [emailSearch, setEmailSearch] = useState('');
  const [debouncedEmail, setDebouncedEmail] = useState('');

  const { user } = useProfile();
  const userRole = user?.role;

  //Данные о промокодах:
  const { data: promos } = useAdminPromos();
  //Данные о персональных скидках:
  const { data: personal } = useAdminPersonalDiscounts(debouncedEmail);
  //Мутация генерации новых промокодов и персональных скидок:
  const generateMutation = useAdminDiscountsGeneration();


  //Дебаунс для поиска
  const updateSearch = useMemo(
    () => debounce((val: string) => setDebouncedEmail(val), 500),
    []
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSearch(e.target.value);
    updateSearch(e.target.value);
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h3>Маркетинг и лояльность</h3>
          <p>Управление промокодами и персональными предложениями.</p>
          {(userRole == 'ADMIN' || userRole == 'SUPERADMIN') && <p>Можно запустить генерацию новых промокодов (старые деактивируются), глобальной скидки (старая заменяется) и персональных скидок (появляются дополнительные)</p>}
        </div>
        {(userRole == 'ADMIN' || userRole == 'SUPERADMIN') &&
          <Button
            type="button"
            variant="primary"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <FaMagic /> {generateMutation.isPending ? 'Генерация...' : 'Запустить алгоритм скидок'}
          </Button>
        }
      </header>

      <div className={styles.contentGrid}>
        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h4><FaTicketAlt /> Общие промокоды</h4>
          </div>
          <DataTable columns={promoColumns} data={promos || []} />
        </section>

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <h4> <FaUserTag />  Персональные скидки</h4>
            </div>

            <Input
              label="Поиск скидок по email"
              id="email-search-for-discounts"
              type="text"
              value={emailSearch}
              placeholder="🔍 Найти по email клиента..."
              onChange={handleEmailChange}
              variant="dark"
              visuallyHidden
            />
          </div>
          <DataTable columns={personalColumns} data={personal || []} />
        </section>
      </div>
    </div>
  );
};
