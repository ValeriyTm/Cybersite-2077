//Состояния:
import { useState } from 'react';
//Работа с формами:
import { useForm } from 'react-hook-form';
//Иконки:
import { FaTrash, FaMotorcycle, FaAlignLeft } from 'react-icons/fa';
//Типы:
import type { News } from '@/entities/content';
//Стили:
import styles from './AdminNewsPage.module.scss';

interface NewsModalProps {
  news: News;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

//Структура полей формы:
interface NewsFormFields {
  title: string;
  excerpt: string;
  status: NewsStatus;
  tags?: string[];
}

enum NewsStatus {
  "DRAFT",
  "PUBLISHED"
}

export const NewsModal = ({ news, onClose, onSubmit }: NewsModalProps) => {
  const { register, handleSubmit } = useForm<NewsFormFields>({
    defaultValues: news || { title: '', excerpt: '', status: 'DRAFT', tags: [] }
  });

  // Локальный стейт для блоков контента
  const [blocks, setBlocks] = useState<News['content'] | []>(news?.content || []);
  const [mainImage, setMainImage] = useState<File | null>(null);

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

  const handleFormSubmit = (data: NewsFormFields) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('excerpt', data.excerpt);
    formData.append('status', String(data.status));
    formData.append('content', JSON.stringify(blocks)); //Массив блоков в JSON
    if (mainImage) formData.append('mainImage', mainImage);

    onSubmit(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.largeModal}`}>
        <h4>{news ? 'Редактировать новость' : 'Создать публикацию'}</h4>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className={styles.mainFields}>
            <input {...register('title')} placeholder="Заголовок новости" required />
            <textarea {...register('excerpt')} placeholder="Краткое превью (для списка)" rows={2} />

            <label className={styles.fileLabel}>
              Обложка новости:
              <input type="file" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className={styles.blocksSection}>
            <h5>Конструктор контента</h5>
            {blocks.map((block, index) => (
              <div key={index} className={styles.blockItem}>
                <span className={styles.blockType}>{block.type}</span>
                {block.type === 'text' && (
                  <textarea
                    value={block.value}
                    onChange={(e) => updateBlock(index, e.target.value)}
                    placeholder="Введите текст..."
                  />
                )}
                {block.type === 'motorcycle' && (
                  <input
                    className={styles.uuid}
                    value={block.value}
                    onChange={(e) => updateBlock(index, e.target.value)}
                    placeholder="ID мотоцикла (UUID)"
                  />
                )}
                <button type="button" onClick={() => removeBlock(index)}><FaTrash /></button>
              </div>
            ))}

            <div className={styles.blockControls}>
              <button type="button" onClick={() => addBlock('text')}><FaAlignLeft /> Текст</button>
              <button type="button" onClick={() => addBlock('motorcycle')}><FaMotorcycle /> Байк</button>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.saveBtn}>Опубликовать</button>
          </div>
        </form>
      </div>
    </div>
  );
};
