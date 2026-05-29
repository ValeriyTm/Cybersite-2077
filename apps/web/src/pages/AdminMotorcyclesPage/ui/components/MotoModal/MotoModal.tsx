//Состояния:
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
//Работа с формами и валидацией:
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMotorcycleAdminFrontendSchema, type MotoFrontendFormValues } from "@repo/validation";
import { handleFormError } from "@/shared/lib";
//Компоненты:
import { Button, Input, Select, Textarea } from "@/shared/ui";
//API:
import { $api, API_URL } from "@/shared/api";
//Типы:
import {
  MOTO_CATEGORIES,
  COOLING_TYPES,
  GEARBOX_TYPES,
  TRANSMISSION_TYPES,
  STARTER_TYPES,
} from "../../../model/constants";
import type { MotorcycleEditAdmin } from "@/entities/catalog";
//Стили:
import styles from "./MotoModal.module.scss";

interface MotoModalProps {
  moto: MotorcycleEditAdmin | null;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  isOpen: boolean;
  isPending: boolean;
}

export const MotoModal = ({ isOpen, moto, onClose, onSubmit, isPending }: MotoModalProps) => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      ...moto,
      colors: moto?.colors ? moto.colors.join(", ") : "",
      siteCategory: moto?.siteCategory || "Мотоциклы",
    } as unknown as MotoFrontendFormValues,
    resolver: zodResolver(createMotorcycleAdminFrontendSchema),
    mode: "onSubmit",
  });

  const [searchResults, setSearchResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [mainImageId, setMainImageId] = useState<string | null>(
    moto?.images?.find((img) => img.isMain)?.id || null,
  );

  const [searchQuery, setSearchQuery] = useState(moto?.brand?.name || "");

  //Обработка ошибок валидации:
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      handleFormError(errors, "brand-form-error"); //Кастомная функция для вывода ошибок
    }
  }, [errors]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);

    setValue("brandId", "");

    if (val.length >= 2) {
      try {
        const { data } = await $api.get(`/admin/brands/search?query=${val}`);
        setSearchResults(data);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleFormSubmit = (data: MotoFrontendFormValues) => {
    const formData = new FormData();

    //Добавляем все текстовые поля:
    Object.keys(data).forEach((key) => {
      const typedKey = key as keyof MotoFrontendFormValues;
      const value = data[typedKey];

      if (typedKey === "colors") {
        const colorsArray = data.colors.split(",").map((c: string) => c.trim());
        colorsArray.forEach((c: string) => formData.append("colors[]", c));
        return;
      }

      //Если значение null или undefined, отправляем пустую строку:
      if (value == null || value == undefined) {
        formData.append(typedKey, "");
      } else {
        formData.append(typedKey, String(value));
      }
    });

    deletedImageIds.forEach((id) => formData.append("deletedImageIds[]", id));
    if (mainImageId) formData.append("mainImageId", mainImageId);
    selectedFiles.forEach((file) => formData.append("images", file));

    onSubmit(formData); //Передаем FormData в мутацию
  };

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
        <div className={`${styles.modal} ${styles.largeModal}`} onClick={(e) => e.stopPropagation()}>
          <h4>{moto ? "Редактировать параметры" : "Добавить новый байк"}</h4>

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className={styles.gridForm}
          >
            {/*Блок 1: Основные данные*/}
            <div className={styles.sectionDivider}>Основные данные</div>

            <div className={styles.fieldGroup}>
              <Input
                label="Имя"
                placeholder="Напр: CBR 1000RR"
                registration={register("model")}
                error={errors.model}
                variant="dark-full"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Input
                label="Год"
                placeholder="Год производства"
                registration={register("year")}
                error={errors.year}
                variant="dark-full"
                type="number"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Выбор бренда</label>
              <div className={styles.searchContainer}>
                <Input
                  label="Имя"
                  placeholder="Введите название бренда..."
                  error={errors.brandId}
                  onChange={(e) => handleSearch(e.target.value)}
                  value={searchQuery}
                  variant="dark-full"
                  autoComplete="off"
                  visuallyHidden
                />

                {/*Выпадающий список результатов:*/}
                {searchResults.length > 0 && (
                  <ul className={styles.dropdown}>
                    {searchResults.map((brand) => (
                      <li
                        key={brand.id}
                        onClick={() => {
                          setValue("brandId", brand.id); //Записываем UUID в форму
                          setSearchQuery(brand.name); //Показываем название в инпуте
                          setSearchResults([]); //Закрываем список
                        }}
                      >
                        {brand.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/*Скрытое поле для валидации и отправки:*/}
              <input type="hidden" {...register("brandId", { required: true })} />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                label="Категория"
                registration={register("category")}
                error={errors.category}
                options={MOTO_CATEGORIES}
                left={true}
                variant="dark-full"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Input
                label="Цена"
                placeholder="Цена (₽)"
                registration={register("price")}
                error={errors.price}
                variant="dark-full"
                type="number"
              />
            </div>

            {/*Блок 2 - Внешний вид */}
            <div className={styles.sectionDivider}>Внешний вид</div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <Input
                label="Доступные цвета"
                placeholder="black, lightgray, white, pink"
                registration={register("colors")}
                error={errors.colors}
                variant="dark-full"
              />
              <small className={styles.light}>
                Введите названия цветов на английском через запятую
              </small>
            </div>

            {/* Блок 3 - Технические хар-ки */}
            <div className={styles.sectionDivider}>Двигатель и трансмиссия</div>
            <div className={styles.fieldGroup}>
              <Input
                label="Объем (см³)"
                registration={register("displacement")}
                error={errors.displacement}
                variant="dark-full"
                type="number"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Input
                label="Мощность (л.с.)"
                registration={register("power")}
                error={errors.power}
                variant="dark-full"
                type="number"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                label="Охлаждение"
                registration={register("coolingSystem")}
                error={errors.coolingSystem}
                options={COOLING_TYPES}
                left={true}
                variant="dark-full"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                label="Коробка передач"
                registration={register("gearbox")}
                error={errors.gearbox}
                options={GEARBOX_TYPES}
                left={true}
                variant="dark-full"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                label="Трансмиссия"
                registration={register("transmission")}
                error={errors.transmission}
                options={TRANSMISSION_TYPES}
                left={true}
                variant="dark-full"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                label="Стартер"
                registration={register("starter")}
                error={errors.starter}
                options={STARTER_TYPES}
                left={true}
                variant="dark-full"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <Textarea
                label="Описание / Комментарии"
                placeholder="Ваш комментарий..."
                registration={register("comments")}
                error={errors.comments}
                variant="dark-full"
              />
            </div>

            {/*Изображения:*/}
            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Текущие изображения</label>
              <div className={styles.existingImagesGrid}>
                {moto?.images
                  ?.filter((img) => !deletedImageIds.includes(img.id))
                  .map((img) => {
                    return (
                      <div
                        key={img.id}
                        className={`${styles.imageItem} ${mainImageId === img.id ? styles.main : ""}`}
                      >
                        <img
                          src={`${API_URL}/static/motorcycles/${img.url}`}
                          alt="motorcycle image"
                        />

                        <div className={styles.imageActions}>
                          <button
                            type="button"
                            onClick={() => setMainImageId(img.id)}
                            title="Сделать главным"
                            className={styles.imgBtn}
                          >
                            ★
                          </button>
                          <button
                            type="button"
                            className={styles.imgBtn}
                            title="Удалить"
                            onClick={() =>
                              setDeletedImageIds((prev) => [...prev, img.id])
                            }
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <Input
                label="Имя"
                placeholder="+ Добавить новые фото"
                variant="dark-full"
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setSelectedFiles((prev) => [...prev, ...files]); // Добавляем к текущим, а не заменяем
                }}
              />
            </div>

            {/*Скрытое поле для категории сайта (по дефолту "Мотоциклы"):*/}
            <input
              type="hidden"
              {...register("siteCategory")}
              value="Мотоциклы"
            />

            <div className={`${styles.modalActions} ${styles.fullWidth}`}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Отмена
              </Button>

              <Button
                type="submit"
                variant="outline-dark"
                isLoading={isPending}
                loadingText="Сохранение..."
              >
                Сохранить байк
              </Button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>,
    document.getElementById("modals-root")!
  );
};
