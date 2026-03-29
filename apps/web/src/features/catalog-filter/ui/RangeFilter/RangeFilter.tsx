import React from "react";
import styles from "./RangeFilter.module.scss";

interface RangeFilterProps {
  label: string;
  min: number | undefined;
  max: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
  step?: number;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({
  label,
  min,
  max,
  onChange,
  step = 1,
}) => {
  return (
    <div className={styles.RangeFilter}>
      <h4 className={styles.label}>{label}</h4>
      <div className={styles.inputs}>
        <input
          type="number"
          placeholder="От"
          value={min ?? ""}
          step={step}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : undefined, max)
          }
          className={styles.input}
        />
        <span className={styles.divider}>—</span>
        <input
          type="number"
          placeholder="До"
          value={max ?? ""}
          step={step}
          onChange={(e) =>
            onChange(min, e.target.value ? Number(e.target.value) : undefined)
          }
          className={styles.input}
        />
      </div>
    </div>
  );
};
