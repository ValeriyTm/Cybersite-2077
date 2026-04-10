import { useForm } from "react-hook-form";
import {
  MOTO_CATEGORIES,
  COOLING_TYPES,
  GEARBOX_TYPES,
  TRANSMISSION_TYPES,
  STARTER_TYPES,
} from "../model/constants";
import styles from "./AdminMotorcyclesPage.module.scss";

export const MotoModal = ({ moto, onClose, onSubmit }: any) => {
  const { register, handleSubmit } = useForm({
    defaultValues: moto || { year: 2024, price: 0, rating: 0 },
  });

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.largeModal}`}>
        <h4>{moto ? "Редактировать параметры" : "Добавить новый байк"}</h4>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.gridForm}>
          {/* БЛОК 1: ОСНОВНОЕ */}
          <div className={styles.sectionDivider}>Основные данные</div>
          <div className={styles.fieldGroup}>
            <label>Модель</label>
            <input
              {...register("model")}
              placeholder="Напр: CBR 1000RR"
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label>Бренд (ID)</label>
            <input
              {...register("brandId")}
              placeholder="UUID бренда"
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label>Категория</label>
            <select {...register("category")}>
              {MOTO_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label>Цена (₽)</label>
            <input {...register("price")} type="number" required />
          </div>

          {/* БЛОК 2: ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ */}
          <div className={styles.sectionDivider}>Двигатель и трансмиссия</div>
          <div className={styles.fieldGroup}>
            <label>Объем (см³)</label>
            <input {...register("displacement")} type="number" />
          </div>
          <div className={styles.fieldGroup}>
            <label>Мощность (л.с.)</label>
            <input {...register("power")} type="number" step="0.1" />
          </div>

          <div className={styles.fieldGroup}>
            <label>Охлаждение</label>
            <select {...register("coolingSystem")}>
              {COOLING_TYPES.map((t) => (
                <option key={t.value} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Коробка передач</label>
            <select {...register("gearbox")}>
              {GEARBOX_TYPES.map((g) => (
                <option key={g.value} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Трансмиссия</label>
            <select {...register("gearbox")}>
              {TRANSMISSION_TYPES.map((g) => (
                <option key={g.value} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Стартер</label>
            <select {...register("gearbox")}>
              {STARTER_TYPES.map((g) => (
                <option key={g.value} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup + " " + styles.fullWidth}>
            <label>Описание / Комментарии</label>
            <textarea {...register("comments")} rows={3} />
          </div>

          {/* Скрытое поле для категории сайта (по дефолту "Мотоциклы") */}
          <input
            type="hidden"
            {...register("siteCategoryId")}
            value="твой-uuid-категории-мото"
          />

          <div className={`${styles.modalActions} ${styles.fullWidth}`}>
            <button type="button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn}>
              Сохранить байк
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
