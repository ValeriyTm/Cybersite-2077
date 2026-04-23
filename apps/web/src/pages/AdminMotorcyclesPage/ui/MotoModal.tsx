import { useForm } from "react-hook-form";
import {
  MOTO_CATEGORIES,
  COOLING_TYPES,
  GEARBOX_TYPES,
  TRANSMISSION_TYPES,
  STARTER_TYPES,
} from "../model/constants";
import styles from "./AdminMotorcyclesPage.module.scss";
import { useState, useEffect } from "react";
import { $api, API_URL } from "@/shared/api/api";


export const MotoModal = ({ moto, onClose, onSubmit }: any) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {

      ...moto,
      colors: moto?.colors ? moto.colors.join(", ") : "",
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [mainImageId, setMainImageId] = useState<string | null>(
    moto?.images?.find((img: any) => img.isMain)?.id || null,
  );

  //Если мы редактируем байк, подставим название текущего бренда в инпут поиска:
  useEffect(() => {
    if (moto?.brand?.name) setSearchQuery(moto.brand.name);
  }, [moto]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
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

  const handleFormSubmit = (data: any) => {
    const formData = new FormData();

    //Добавляем все текстовые поля:
    Object.keys(data).forEach((key) => {
      if (key === "colors") {
        const colorsArray = data.colors.split(",").map((c: any) => c.trim());
        colorsArray.forEach((c: any) => formData.append("colors[]", c));
      } else {
        formData.append(key, data[key]);
      }
    });

    //Отправляем список ID на удаление:
    deletedImageIds.forEach((id) => formData.append("deletedImageIds[]", id));

    //Отправляем ID новой главной картинки:
    if (mainImageId) formData.append("mainImageId", mainImageId);

    //Добавляем новые файлы:
    selectedFiles.forEach((file) => formData.append("images", file));

    onSubmit(formData); //Передаем FormData в мутацию
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.largeModal}`}>
        <h4>{moto ? "Редактировать параметры" : "Добавить новый байк"}</h4>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className={styles.gridForm}
        >
          {/*Блок 1: Основные данные*/}
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
            <label>Год</label>
            <input {...register("year")} type="number" step="1" />
          </div>

          <div className={styles.fieldGroup}>
            <label>Выбор бренда</label>
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Введите название бренда..."
                autoComplete="off"
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

          {/*Блок 2 - Внешний вид */}
          <div className={styles.sectionDivider}>Внешний вид</div>

          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label>Доступные цвета (через запятую)</label>
            <input
              {...register("colors")}
              placeholder="black, lightgray, white, pink"
            />
            <small >
              Введите названия цветов на английском через запятую
            </small>
          </div>

          {/* Блок 3 - Технические хар-ки */}
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
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Коробка передач</label>
            <select {...register("gearbox")}>
              {GEARBOX_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Трансмиссия</label>
            <select {...register("transmission")}>
              {TRANSMISSION_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Стартер</label>
            <select {...register("starter")}>
              {STARTER_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup + " " + styles.fullWidth}>
            <label>Описание / Комментарии</label>
            <textarea {...register("comments")} rows={3} />
          </div>

          {/*Изображения:*/}
          <div className={styles.fieldGroup + " " + styles.fullWidth}>
            <label>Текущие изображения</label>
            <div className={styles.existingImagesGrid}>
              {moto?.images
                ?.filter((img: any) => !deletedImageIds.includes(img.id))
                .map((img: any) => {
                  console.log("img url: ", img.url);
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
                          title="Сделать главной"
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          className={styles.deleteImgBtn}
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

            <label className={styles.uploadLabel}>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setSelectedFiles(Array.from(e.target.files || []))
                }
              />
              <span>+ Добавить новые фото</span>
            </label>
          </div>

          {/*Скрытое поле для категории сайта (по дефолту "Мотоциклы"):*/}
          <input
            type="hidden"
            {...register("siteCategoryId")}
            value="081b4c44-59b1-4b2a-884b-f4bcfdc7c21e"
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
