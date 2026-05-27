import toast from "react-hot-toast";
//Компоненты:
import { Button } from "@/shared/ui";
//Стили:
import styles from "./PromoCard.module.scss";

interface PromoCardProps {
  promo: {
    code: string;
    discountAmount: number;
    expiresAt: string;
  };
}

export const PromoCard = ({ promo }: PromoCardProps) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(promo.code);
    toast.success(`Промокод ${promo.code} скопирован!`);
  };

  const formattedDate = promo.expiresAt
    ? new Date(promo.expiresAt).toLocaleDateString()
    : "Не ограничено";

  return (
    <div className={styles.promoCard}>
      <div className={styles.amount}>
        -{promo.discountAmount.toLocaleString()} ₽
      </div>

      <div className={styles.codeWrap}>
        <span className={styles.code}>{promo.code}</span>
        <Button type="button" variant="outline" onClick={copyToClipboard}>
          Копировать
        </Button>
      </div>

      <div className={styles.expires}>
        Действует до: {formattedDate}
      </div>
    </div>
  );
};
