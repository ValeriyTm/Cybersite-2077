//Компоненты:
import { Button, Input } from "@/shared/ui";
//Стили:
import styles from "./AdminMotorcycleHeader.module.scss";

interface AdminMotorcyclesHeaderProps {
  searchValue: string;
  onChangeSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userRole?: string;
  onAddClick: () => void;
}

export const AdminMotorcyclesHeader = ({
  searchValue,
  onChangeSearch,
  userRole,
  onAddClick,
}: AdminMotorcyclesHeaderProps) => {
  const canAddMoto =
    userRole === "ADMIN" || userRole === "SUPERADMIN" || userRole === "MANAGER";

  return (
    <header className={styles.header}>
      <h3>Каталог мотоциклов</h3>
      <Input
        label="Поиск по модели мотоцикла"
        id="moto-search"
        title="Поиск по модели мотоцикла"
        placeholder="🔍 Быстрый поиск..."
        variant="dark-full"
        value={searchValue}
        onChange={onChangeSearch}
        visuallyHidden
      />
      {canAddMoto && (
        <Button type="button" variant="outline-dark" onClick={onAddClick}>
          + Добавить модель
        </Button>
      )}
    </header>
  );
};
