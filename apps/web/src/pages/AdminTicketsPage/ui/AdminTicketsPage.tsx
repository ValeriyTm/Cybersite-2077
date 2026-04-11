import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { $api } from '@/shared/api/api';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { getTicketColumns } from '../model/columns';
import { FaPaperclip, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './AdminTicketsPage.module.scss';

export const AdminTicketsPage = () => {
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [answer, setAnswer] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const queryClient = useQueryClient();

    // 1. Получение данных
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-tickets', statusFilter],
        queryFn: () => $api.get('/admin/tickets', {
            params: { status: statusFilter }
        }).then(res => res.data)
    });

    // 2. Мутация изменения статуса (из Select в таблице)
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            $api.patch(`/admin/tickets/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            toast.success('Статус обновлен');
        }
    });

    // 3. Мутация отправки ответа
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

    // 4. Подготовка колонок
    const columns = getTicketColumns(
        (id, status) => statusMutation.mutate({ id, status }),
        (ticket) => {
            setSelectedTicket(ticket);
        }
    );

    const getFileUrl = (rawUrl: string) => {
        // Убираем "uploads/support/" и заменяем все \\ на /
        // const fileName = rawUrl.replace(/static[\\/]support[\\/]/, '').replace(/\\/g, '/');
        return `http://localhost:3001/static/support/${rawUrl}`;
    };

    if (isLoading) return <div className={styles.loader}>Загрузка тикетов...</div>;

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div className={styles.titleBlock}>
                    <h3>Поддержка пользователей</h3>
                    <p>Обработка входящих тикетов и вопросов</p>
                    <button onClick={() => setSelectedTicket({ id: 'test', description: 'тест', attachments: [] })}>
                        ТЕСТ МОДАЛКИ
                    </button>

                </div>

                <div className={styles.filters}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">Все статусы</option>
                        <option value="OPEN">Только открытые (OPEN)</option>
                        <option value="IN_PROGRESS">В работе (IN_PROGRESS)</option>
                        <option value="RESOLVED">Решенные (RESOLVED)</option>
                        <option value="CLOSED">Закрытые (CLOSED)</option>
                    </select>
                </div>
            </header>

            <DataTable columns={columns} data={tickets || []} />

            {/* МОДАЛЬНОЕ ОКНО ОТВЕТА */}
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
                                <strong>Категория:</strong> {selectedTicket.category}
                            </div>
                            <div className={styles.messageBox}>
                                <strong>Сообщение:</strong>
                                <p>{selectedTicket.description}</p>
                            </div>

                            {/* БЛОК ВЛОЖЕНИЙ */}
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
                                disabled={!answer.trim() || replyMutation.isPending}
                            >
                                {replyMutation.isPending ? 'Отправка...' : 'Отправить ответ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
