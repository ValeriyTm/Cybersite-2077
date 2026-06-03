import { useEffect, useState } from 'react';
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//Работа с формами и валидацией:
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { handleFormError } from '@/shared/lib';
import { SaveNewsFrontendSchema, type SaveNewsFrontendType } from '@repo/validation';
//API:
import { API_URL } from '@/shared/api';
//Компоненты:
import { AdminButton, Button, Input, Textarea } from '@/shared/ui';
//Иконки:
import { FaMotorcycle, FaAlignLeft } from 'react-icons/fa';
//Типы:
import type { News } from '@/entities/content';
//Стили:
import styles from './NewsModal.module.scss';

interface NewsModalProps {
  news: News;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isRestricted?: boolean;
}

const BASE_URL = `${API_URL}/static/news/`;

export const NewsModal = ({ news, onClose, onSubmit, isRestricted }: NewsModalProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(SaveNewsFrontendSchema),
    defaultValues: {
      title: news?.title || '',
      excerpt: news?.excerpt || '',
      status: String(news?.status) === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      tags: news?.tags || [],
      content: news?.content || []
    }
  });

  //Cтейт для блоков контента:
  const [blocks, setBlocks] = useState<News['content'] | []>(news?.content || []);
  const [mainImage, setMainImage] = useState<File | null>(null);

  //Блокировка скроллбара:
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    //Возвращаем исходный скролл при размонтировании модалки:
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const addBlock = (type: 'text' | 'image' | 'motorcycle') => {
    setBlocks([...blocks, { type, value: '' }]);
  };

  const updateBlock = (index: number, value: string) => {
    const newBlocks = [...blocks];
    newBlocks[index].value = value;
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: SaveNewsFrontendType) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('excerpt', data.excerpt);
    formData.append('status', data.status);
    formData.append('content', JSON.stringify(blocks)); //Массив блоков в JSON
    if (mainImage) formData.append('mainImage', mainImage);

    onSubmit(formData);
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <FocusTrap focusTrapOptions={{ onDeactivate: onClose, escapeDeactivates: true }}>
        <div className={`${styles.modal} ${styles.largeModal}`} onClick={(e) => e.stopPropagation()}>
          <h4>{news ? 'Редактировать новость' : 'Создать публикацию'}</h4>
          <form onSubmit={handleSubmit(
            handleFormSubmit,
            (errors) => handleFormError(errors, 'news-modal-error')
          )}>
            {/*1) Header:*/}
            <div className={styles.mainFields}>
              <Input
                label="Заголовок новости:"
                title="Заголовок новости"
                placeholder="Заголовок новости"
                registration={register("title")}
                error={errors.title}
                required
                variant="dark-full"
              />

              <Textarea
                label="Текст абзаца новости"
                placeholder="Краткое превью (для списка)"
                registration={register("excerpt")}
                error={errors.excerpt}
                rows={2}
                variant="dark-full"
              />

              {/*Превью для существующей обложки:*/}
              {news?.mainImage && !mainImage && (
                <div className={styles.imagePreview}>
                  <p>Текущая обложка:</p>
                  <img
                    src={`${BASE_URL}${news.mainImage}`}
                    alt="Текущая обложка новости"
                    className={styles.previewImg}
                  />
                </div>
              )}

              {/*Превью для новой обложки:*/}
              {mainImage && (
                <div className={styles.imagePreview}>
                  <p>Новая обложка (нажмите «Опубликовать» для сохранения):</p>
                  <img
                    src={URL.createObjectURL(mainImage)}
                    alt="Превью новой обложки"
                    className={styles.previewImg}
                  />
                </div>
              )}

              <Input
                label="Обложка новости:"
                title="Обложка новости"
                type="file"
                onChange={(e) => setMainImage(e.target.files?.[0] || null)}
                variant="dark-full"
              />
            </div>

            {/*2) Конструктор:*/}
            <div className={styles.blocksSection}>
              <h5>Конструктор контента</h5>
              {blocks.map((block, index) => (
                <div key={index} className={styles.blockItem}>
                  <span className={styles.blockType}>{block.type}</span>
                  <div className={styles.blockItemFields}>
                    {block.type === 'text' && (
                      <Textarea
                        label="Текст абзаца новости"
                        placeholder="Введите текст..."
                        variant="dark-full"
                        value={block.value}
                        onChange={(e) => updateBlock(index, e.target.value)}
                        visuallyHidden
                      />
                    )}
                    {block.type === 'motorcycle' && (
                      <Input
                        label="id мотоцикла"
                        title="id мотоцикла"
                        value={block.value}
                        placeholder="ID мотоцикла (UUID)"
                        onChange={(e) => updateBlock(index, e.target.value)}
                        variant="dark-full"
                        visuallyHidden
                      />
                    )}
                    <AdminButton variant="delete" title={`Удалить модель блок`} onClick={() => removeBlock(index)} />
                  </div>
                </div>
              ))}

              <div className={styles.blockControls}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('text')}
                  title='Добавить блок текста'
                >
                  <FaAlignLeft /> Текст
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('motorcycle')}
                  title='Добавить блок с карточкой мотоцикла'
                >
                  <FaMotorcycle /> Байк
                </Button>
              </div>
            </div>

            {/*3) Footer:*/}
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
                disabled={isRestricted}
              >
                Опубликовать
              </Button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>,
    document.getElementById("modals-root")!
  );
};