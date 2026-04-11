import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { getTicketColumns } from '../model/columns';
import { FaPaperclip, FaTimes } from 'react-icons/fa';
import { debounce } from 'lodash';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './AdminTicketsPage.module.scss';

export const AdminTicketsPage = () => {
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [answer, setAnswer] = useState('');
    const [emailValue, setEmailValue] = useState(''); //Для мгновенного ввода
    const [debouncedEmail, setDebouncedEmail] = useState(''); //Для API-запроса
    const [statusFilter, setStatusFilter] = useState('');

    const queryClient = useQueryClient();

    //Настраиваем задержку поиска:
    const updateSearch = useMemo(
        () => debounce((val: string) => setDebouncedEmail(val), 500),
        []
    );

    //При смене фильтров сбрасываем страницу на первую:
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailValue(e.target.value);
        updateSearch(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (val: string) => {
        setStatusFilter(val);
        setPage(1);
    };

    // 1. Получение данных
    const { data, isLoading } = useQuery({
        queryKey: ['admin-tickets', page, statusFilter, debouncedEmail],
        queryFn: () => $api.get('/admin/tickets', {
            params: {
                page,
                limit: 10,
                status: statusFilter,
                email: debouncedEmail
            }
        }).then(res => res.data)
    });

    //Мутация изменения статуса (из Select в таблице):
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            $api.patch(`/admin/tickets/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            toast.success('Статус обновлен');
        }
    });

    //Мутация отправки ответа:
    const replyMutation = useMutation({
        mutationFn: () => $api.patch(`/admin/tickets/${selectedTicket.id}/reply`, { answer }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            setSelectedTicket(null);
            setAnswer('');
            toast.success('Ответ успешно отправлен');
        },
        onError: () => toast.error('Ошибка при отправке ответа')
    });

    //Подготовка колонок:
    const columns = getTicketColumns(
        (id, status) => statusMutation.mutate({ id, status }),
        (ticket) => {
            setSelectedTicket(ticket);
        }
    );

    const getFileUrl = (rawUrl: string) => {
        return `http://localhost:3001/static/support/${rawUrl}`;
    };

    //Переводим на русский:
    const categoryMap = {
        COOPERATION: 'Сотрудничество',
        COMPLAINT: 'Жалоба',
        ORDER: 'Заказ',
        TECHNICAL: 'Технический вопрос',
        OTHER: 'Другое'
    };


    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div className={styles.titleBlock}>
                    <h3>Поддержка пользователей</h3>
                    <p>Обработка входящих тикетов и вопросов</p>
                </div>



                <div className={styles.filters}>
                    {/*Поиск по email:*/}
                    <input
                        type="text"
                        placeholder="🔍 Поиск по email..."
                        className={styles.emailSearch}
                        value={emailValue}
                        onChange={handleEmailChange}
                    />

                    {/*Фильтрация по статусам:*/}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">Все статусы</option>
                        <option value="OPEN">Только открытые</option>
                        <option value="IN_PROGRESS">В работе</option>
                        <option value="RESOLVED">Решенные</option>
                        <option value="CLOSED">Закрытые</option>
                    </select>
                </div>
            </header>

            {/*Лоадер только на таблицу, чтобы при поиске не сбрасывался фокус:*/}
            {isLoading ? (
                <div className={styles.loader}>Загрузка...</div>
            ) : (

                <DataTable columns={columns} data={data?.data || []} />
            )}



            {/*Блок пагинации:*/}
            {data?.meta && data.meta.lastPage > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        ← Назад
                    </button>

                    <span>
                        Страница <strong>{page}</strong> из {data.meta.lastPage}
                    </span>

                    <button
                        disabled={page >= data.meta.lastPage}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Вперёд →
                    </button>
                </div>
            )}


            {/*Модальное окно для ответа на тикет:*/}
            {selectedTicket && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h4>Тикет #{selectedTicket.id.slice(0, 8)}</h4>
                            <button className={styles.closeBtn} onClick={() => setSelectedTicket(null)}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className={styles.ticketInfo}>
                            <div className={styles.infoRow}>
                                <strong>Отправитель:</strong> {selectedTicket.firstName} {selectedTicket.lastName} ({selectedTicket.email})
                            </div>
                            <div className={styles.infoRow}>
                                <strong>Категория:</strong> {categoryMap[selectedTicket.category] || 'Другое'}
                            </div>
                            <div className={styles.messageBox}>
                                <strong>Сообщение:</strong>
                                <p>{selectedTicket.description}</p>
                            </div>

                            {/*Блок вложений:*/}
                            {selectedTicket.attachments?.length > 0 && (
                                <div className={styles.attachmentsBlock}>
                                    <strong>Прикрепленные файлы:</strong>
                                    <div className={styles.fileList}>
                                        {selectedTicket.attachments.map((file: any) => {

                                            return (
                                                <a
                                                    key={file.id}
                                                    href={getFileUrl(file.fileUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={file.originalName}
                                                    className={styles.fileLink}
                                                    style={{ position: 'relative', zIndex: 1001, pointerEvents: 'auto' }}
                                                >
                                                    <FaPaperclip /> {file.originalName}
                                                </a>
                                            )
                                        }
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.answerArea}>
                            <strong>Ваш ответ:</strong>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Текст ответа будет отправлен пользователю..."
                                rows={6}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setSelectedTicket(null)}>
                                Отмена
                            </button>

                            <button
                                className={styles.submitBtn}
                                onClick={() => replyMutation.mutate()}
                                disabled={
                                    !answer.trim() ||
                                    replyMutation.isPending ||
                                    !selectedTicket.userId //Блокируем, если нет привязки к аккаунту (вопрос оставил не зарегистрированный пользователь)
                                }
                            >
                                {replyMutation.isPending
                                    ? 'Отправка...'
                                    : !selectedTicket.userId
                                        ? 'Ответ невозможен (гость)'
                                        : 'Отправить ответ'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};
