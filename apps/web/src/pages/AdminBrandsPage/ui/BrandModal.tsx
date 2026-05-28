import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//Работа с формами и валидация:
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBrandAdminFrontendSchema } from "@repo/validation";
import { handleFormError } from "@/shared/lib";
//Компоненты:
import { Button, Input } from "@/shared/ui";
//Типы:
import { type BrandData } from "@/entities/catalog";
//Стили:
import styles from "./BrandModal.module.scss";

interface BrandModalProps {
  isOpen: boolean;
  brand: BrandData | null; // null, если мы добавляем новый бренд
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: BrandData) => void;
}

export const BrandModal = ({ isOpen, brand, isSubmitting, onClose, onSubmit }: BrandModalProps) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BrandData>({
    defaultValues: brand || { name: "", country: "", slug: "" },
    resolver: zodResolver(CreateBrandAdminFrontendSchema),
    mode: "onSubmit",
  });

  // Сброс полей формы при смене выбранного бренда или открытии:
  useEffect(() => {
    if (isOpen) {
      reset(brand || { name: "", country: "", slug: "" });
    }
  }, [brand, isOpen, reset]);

  //Обработка ошибок валидации:
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      handleFormError(errors, "brand-form-error"); //Кастомная функция для вывода ошибок
    }
  }, [errors]);

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
    <div className={styles.modalOverlay} onClick={onClose}>
      <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: onClose }}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h4>{brand ? "Редактировать" : "Добавить"} бренд</h4>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              registration={register("name")}
              label="Название бренда"
              id="brand-name"
              required
              title="Имя бренда"
              placeholder="Название бренда (напр. Honda)"
              disabled={isSubmitting}
              variant="dark-full"
              visuallyHidden
            />

            <Input
              registration={register("country")}
              label="Страна производства"
              id="country-name"
              required
              title="Страна производства бренда"
              placeholder="Страна"
              disabled={isSubmitting}
              variant="dark-full"
              visuallyHidden
            />

            <Input
              registration={register("slug")}
              label="slug для модели"
              id="model-name"
              required
              title="Бренд малыми eng-буквами"
              placeholder='Slug (honda)'
              disabled={isSubmitting}
              variant="dark-full"
              visuallyHidden
            />

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
              >
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>,
    document.getElementById("modals-root")!
  );
};
