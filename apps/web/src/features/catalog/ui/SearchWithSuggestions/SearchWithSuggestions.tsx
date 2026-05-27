import { useState, useMemo, useEffect, useRef } from "react";
//Навигация:
import { Link, useNavigate } from "react-router";
//Дебаунс:
import debounce from "lodash/debounce";
//API:
import { $api, API_URL } from "@/shared/api";
//Типы:
import type { MotorcycleShort } from "@/entities/catalog";
//Изображения:
import defaultMotoImage from '@/shared/assets/images/defaults/default-card-icon.jpg';
//Стили:
import styles from "./SearchWithSuggestions.module.scss";

export const SearchWithSuggestions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MotorcycleShort[]>([]);
  const searchRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();


  //Дебаунс запроса:
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q: string) => {
        try {
          const { data } = await $api.get(
            `/catalog/search/suggest?q=${q}`,
          );
          setSuggestions(data);
        } catch (e) {
          console.error(e);
        }
      }, 300),
    [],
  );

  //Очистка при размонтировании:
  useEffect(() => {
    return () => {
      fetchSuggestions.cancel();
    };
  }, [fetchSuggestions]);

  //Закрытие при клике мимо:
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) fetchSuggestions(val);
    else setSuggestions([]);
  };

  const handleSearchSubmit = (e?: React.SubmitEvent) => {
    e?.preventDefault();
    if (searchQuery.trim().length >= 2) {
      //Переходим в общий каталог с активным поиском:
      navigate(
        `/catalog/motorcycles/all?search=${encodeURIComponent(searchQuery)}`,
      );
      setSuggestions([]); //Закрываем подсказки
    }
  };

  return (
    <form
      className={styles.searchBox}
      onSubmit={handleSearchSubmit}
      ref={searchRef}
    >
      <label htmlFor="main-search" className="visually-hidden">Поиск по каталогу</label>
      <input
        type="search"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
        placeholder="Поиск по каталогу"
        id='main-search'

      />
      <button type="submit">Найти</button>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((moto) => {
            const linkToImage = (moto.mainImage !== '')
              ? `${API_URL}/static/motorcycles/${moto.mainImage}`
              : defaultMotoImage;

            return (
              <Link
                key={moto.id}
                to={`/catalog/motorcycles/${moto.brandSlug}/${moto.slug}`}
                className={styles.suggestItem}
                onClick={() => {
                  setSuggestions([]);
                  setSearchQuery("");
                }}
              >
                <div className={styles.suggestImg}>
                  <img src={linkToImage} alt="moto image" width='50' height='35' />
                </div>
                <div className={styles.suggestInfo}>
                  <span className={styles.suggestModel}>
                    {moto.model}
                  </span>
                  <span className={styles.suggestYear}>
                    {moto.year} г.
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </form>
  )
};
