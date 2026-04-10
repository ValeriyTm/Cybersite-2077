import { useForm } from "react-hook-form";
import styles from "./AdminBrandsPage.module.scss";

export const BrandModal = ({ brand, onClose, onSubmit }: any) => {
  const { register, handleSubmit } = useForm({
    defaultValues: brand || { name: "", country: "", slug: "" },
  });

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h4>{brand ? "Редактировать" : "Добавить"} бренд</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register("name")}
            placeholder="Название бренда (напр. Honda)"
            required
          />
          <input {...register("country")} placeholder="Страна" required />
          <input {...register("slug")} placeholder="Slug (honda)" required />
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
