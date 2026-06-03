import { useEffect, useState } from 'react';
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//API:
import { API_URL } from '@/shared/api';
//Категории:
import { categoryMap } from '../../../model/items';
//Компоненты:
import { Button, Textarea } from '@/shared/ui';
//Иконки:
import { FaPaperclip, FaTimes } from 'react-icons/fa';
//Типы:
import type { Ticket } from '@/entities/support/types/types';
//Стили:
import styles from './AdminTicketModal.module.scss';

interface AdminTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onReply: (answer: string, callback: () => void) => void;
  isPending: boolean;
  role?: string;
}

export const AdminTicketModal = ({ ticket, onClose, onReply, isPending, role }: AdminTicketModalProps) => {
  const [answer, setAnswer] = useState('');

  //Блокировка скролла:
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  //Закрытие модалки по нажатию Esc:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getFileUrl = (rawUrl: string) => {
    return `${API_URL}/static/support/${rawUrl}`;
  };

  const handleSubmitting = () => {
    if (!answer.trim()) return;
    //Коллбэк для очистки текста после успешной отправки внутри мутации:
    onReply(answer, () => setAnswer(''));
  };

  // Текст для кнопки
  let submitButtonText = 'Отправить ответ';
  if (isPending) {
    submitButtonText = 'Отправка...';
  } else if (!ticket.userId) {
    submitButtonText = 'Ответ невозможен (гость)';
  }

  const isRestricted = role == "WATCHER";

  return createPortal(
    <FocusTrap focusTrapOptions={{ allowOutsideClick: true }}>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className={styles.modalHeader}>
            <h4>Тикет #{ticket.id.slice(0, 8)}</h4>
            <button className={styles.closeBtn} onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className={styles.ticketInfo}>
            <div className={styles.infoRow}>
              <strong>Отправитель:</strong> {ticket.firstName} {ticket.lastName} ({ticket.email})
            </div>
            <div className={styles.infoRow}>
              <strong>Категория:</strong> {categoryMap[ticket.category as keyof typeof categoryMap] || 'Другое'}
            </div>
            <div className={styles.messageBox}>
              <strong>Сообщение:</strong>
              <p>{ticket.description}</p>
            </div>

            {/* Блок вложений */}
            {ticket.attachments?.length > 0 && (
              <div className={styles.attachmentsBlock}>
                <p>Прикрепленные файлы:</p>
                <div className={styles.fileList}>
                  {ticket.attachments.map((file) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.answerArea}>

            <Textarea
              label="Ваш ответ:"
              placeholder="Текст ответа будет отправлен пользователю..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              variant='dark-full'
              rows={6}
            />
          </div>

          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Отмена
            </Button>

            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmitting}
              disabled={!answer.trim() || isPending || !ticket.userId || isRestricted}
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.getElementById('modals-root')!
  );
};