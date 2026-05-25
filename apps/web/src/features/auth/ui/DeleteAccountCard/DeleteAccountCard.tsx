//Компоненты:
import { Button } from "@/shared/ui";
//Стили:
import styles from "./DeleteAccountCard.module.scss";

interface DeleteAccountCardProps {
  onOpenDeleteModal: () => void;
}

export const DeleteAccountCard = ({ onOpenDeleteModal }: DeleteAccountCardProps) => {
  return (
    <div className={styles.dangerZone}>
      <h2>Опасная зона</h2>
      <Button
        type="button"
        variant="danger"
        onClick={onOpenDeleteModal}
      >
        Удалить аккаунт
      </Button>
    </div>
  );
};