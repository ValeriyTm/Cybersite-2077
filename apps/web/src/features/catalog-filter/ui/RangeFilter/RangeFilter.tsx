import React, { useState, useEffect, useMemo } from "react";
//Дебаунс для поиска:
import { debounce } from "lodash";
//Стили:
import styles from "./RangeFilter.module.scss";

interface RangeFilterProps {
  label: string;
  min: number | undefined;
  max: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
  step?: number;
}

export const RangeFilter = ({
  label,
  min,
  max,
  onChange,
  step = 1,
}: RangeFilterProps) => {
  /////------------------Внедряем дебаунс:----------------
  //1) Локальный стейт для мгновенного отклика инпутов:
  const [localMin, setLocalMin] = useState<number | undefined>(min);
  const [localMax, setLocalMax] = useState<number | undefined>(max);

  //2) Синхронизируем локальный стейт, если пропсы изменились извне (например, при сбросе фильтров):
  useEffect(() => {
    setLocalMin(min);
    setLocalMax(max);
  }, [min, max]);

  //3) Создаем дебаунс-версию функции уведомления родителя:
  const debouncedOnChange = useMemo(
    () =>
      debounce((newMin: number | undefined, newMax: number | undefined) => {
        onChange(newMin, newMax);
      }, 600), // Задержка 600мс — оптимально для ввода цифр
    [onChange],
  );

  //4) Очистка при размонтировании:
  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setLocalMin(val); // Мгновенно обновляем цифру в инпуте
    debouncedOnChange(val, localMax); // Отправляем в URL с задержкой
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setLocalMax(val); // Мгновенно обновляем цифру в инпуте
    debouncedOnChange(localMin, val); // Отправляем в URL с задержкой
  };

  return (
    <div className={styles.RangeFilter}>
      <h4 className={styles.label}>{label}</h4>
      <div className={styles.inputs}>
        <input
          type="number"
          placeholder="От"
          value={localMin ?? ""}
          step={step}
          onChange={handleMinChange}
          className={styles.input}
        />
        <span className={styles.divider}>—</span>
        <input
          type="number"
          placeholder="До"
          value={localMax ?? ""}
          step={step}
          onChange={handleMaxChange}
          className={styles.input}
        />
      </div>
    </div>
  );
};
