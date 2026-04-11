import { $api } from "@/shared/api/api";
import { DataTable } from "@/shared/ui/DataTable/DataTable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import styles from './AdminTicketsPage.module.scss'
import { ticketColumns } from "../model/columns";
import { FaPaperclip } from "react-icons/fa";


export const AdminTicketsPage = () => {
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [answer, setAnswer] = useState('');
    const queryClient = useQueryClient();

    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-tickets'],
        queryFn: () => $api.get('/admin/tickets').then(res => res.data)
    });

    const replyMutation = useMutation({
        mutationFn: () => $api.patch(`/admin/tickets/${selectedTicket.id}/reply`, { answer }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            setSelectedTicket(null);
            setAnswer('');
            toast.success('Ответ отправлен пользователю');
        }
    });

    const columns = ticketColumns((ticket) => setSelectedTicket(ticket));

    return (
        <div className={styles.pageWrapper}>
            <h3>Тикеты поддержки</h3>
            <DataTable columns={columns} data={tickets || []} />

            {selectedTicket && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h4>Ответ на тикет #{selectedTicket.id.slice(0, 5)}</h4>
                        <div className={styles.userMessage}>
                            <strong>Вопрос ({selectedTicket.category}):</strong>
                            <p>{selectedTicket.description}</p>

                            {/*Ссылки на скачивание файлов */}
                            {selectedTicket.attachments?.length > 0 && (
                                <div className={styles.attachments}>
                                    <span>Прикрепленные файлы:</span>
                                    <ul>
                                        {selectedTicket.attachments.map((file: any) => (
                                            <li key={file.id}>
                                                <a href={`http://localhost:3001/static/support/${file.fileUrl}`} target="_blank" rel="noreferrer">
                                                    <FaPaperclip /> {file.originalName} ({(file.size / 1024).toFixed(1)} KB)
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Введите ваш ответ..."
                            rows={5}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setSelectedTicket(null)}>Отмена</button>
                            <button
                                className={styles.saveBtn}
                                onClick={() => replyMutation.mutate()}
                                disabled={!answer.trim()}
                            >
                                Отправить ответ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
