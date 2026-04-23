import { FaMagic, FaTicketAlt, FaUserTag } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { promoColumns, personalColumns } from '../model/columns';
import styles from './AdminDiscountsPage.module.scss';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';
import { useMemo, useState } from 'react';
import { useProfile } from '@/features/auth/model/useProfile';

export const AdminDiscountsPage = () => {
    const [emailSearch, setEmailSearch] = useState('');
    const [debouncedEmail, setDebouncedEmail] = useState('');
    const queryClient = useQueryClient();

    const { user } = useProfile();
    const userRole = user?.role;

    // 1. Дебаунс для поиска
    const updateSearch = useMemo(
        () => debounce((val: string) => setDebouncedEmail(val), 500),
        []
    );


    const { data: promos } = useQuery({
        queryKey: ['admin-promos'],
        queryFn: () => $api.get('/admin/promos').then(res => res.data)
    });

    const { data: personal } = useQuery({
        queryKey: ['admin-personal', debouncedEmail],
        queryFn: () => $api.get('/admin/personal-discounts', {
            params: { email: debouncedEmail }
        }).then(res => res.data)
    });

    const generateMutation = useMutation({
        mutationFn: () => $api.post('/discount/force-generate'),
        onSuccess: () => {
            toast.success('Массовая генерация запущена!');
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
                queryClient.invalidateQueries({ queryKey: ['admin-personal'] });
            }, 2000); //Даем время воркерам отработать
        }
    });

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
                    <button
                        className={styles.magicBtn}
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                    >
                        <FaMagic /> {generateMutation.isPending ? 'Генерация...' : 'Запустить алгоритм скидок'}
                    </button>}
            </header>

            <div className={styles.contentGrid}>
                <section className={styles.tableSection}>
                    <div className={styles.sectionHeader}>
                        <FaTicketAlt /> <h4>Общие промокоды</h4>
                    </div>
                    <DataTable columns={promoColumns} data={promos || []} />
                </section>

                <section className={styles.tableSection}>
                    <div className={styles.sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                            <FaUserTag /> <h4>Персональные скидки</h4>
                        </div>

                        {/*Инпут поиска по Email:*/}
                        <label htmlFor="email-search-for-discounts" className='visually-hidden'>Поиск скидок по email</label>
                        <input
                            id='email-search-for-discounts'
                            type="text"
                            placeholder="🔍 Найти по email клиента..."
                            className={styles.miniSearch}
                            value={emailSearch}
                            onChange={handleEmailChange}
                        />
                    </div>
                    <DataTable columns={personalColumns} data={personal || []} />
                </section>
            </div>
        </div>
    );
};
