import React from "react";
import styles from "./SelectFilter.module.scss";

interface Option {
  value: string;
  label: string;
}

interface SelectFilterProps {
  label: string;
  value: string | undefined;
  options: Option[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export const SelectFilter: React.FC<SelectFilterProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Все",
}) => {
  return (
    <div className={styles.SelectFilter}>
      <h4 className={styles.label}>{label}</h4>
      <div className={styles.selectWrapper}>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={styles.select}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow}>▼</span>
      </div>
    </div>
  );
};
