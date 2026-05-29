import { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//Компоненты:
import { Button, Input } from '@/shared/ui';
//Типы:
import type { Stock } from '@/entities/admin/types/types';
//Стили:
import styles from './StockEditModal.module.scss';


interface StockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  onSave: (quantity: number) => void;
  isSaving: boolean;
}

export const StockEditModal = ({ isOpen, onClose, stock, onSave, isSaving }: StockEditModalProps) => {
  const [quantity, setQuantity] = useState(stock ? stock.quantity : 0);

  //Блокировка скроллбара:
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);


  if (!isOpen) return null;

  return createPortal(
    <FocusTrap active={isOpen} focusTrapOptions={{ onDeactivate: onClose }}>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h4>Обновить наличие</h4>
          <p>{stock?.warehouse?.name} ({stock?.warehouse?.city})</p>

          <Input
            label="slug для модели"
            id="quantity"
            value={quantity}
            title="Бренд малыми eng-буквами"
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={isSaving}
            variant="dark-full"
            autoFocus
            visuallyHidden
            type="number"
            center
          />

          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => onSave(quantity)}
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.getElementById("modals-root")!
  );
};