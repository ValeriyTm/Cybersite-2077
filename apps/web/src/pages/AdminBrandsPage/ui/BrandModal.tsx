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
          <label htmlFor="brand-name" className="visually-hidden">Название бренда</label>
          <input
            {...register("name")}
            placeholder="Название бренда (напр. Honda)"
            required
            id='brand-name'
            title='Имя бренда'
          />
          <label htmlFor="country-name" className="visually-hidden">Страна производства</label>
          <input {...register("country")} placeholder="Страна" id="country-name" required title='Страна производства бренда' />

          <label htmlFor="model-name" className="visually-hidden">slug для модели</label>
          <input {...register("slug")} placeholder="Slug (honda)" required id="model-name" title='Бренд малыми буквами' />

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
