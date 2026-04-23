//Компоненты:
import { Button } from "@/shared/ui";
//Стили:
import styles from "./TwoFactorModal.module.scss";

interface TwoFactorModalProps {
  qrCode: string;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  onActivate: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const TwoFactorModal = ({
  qrCode,
  verificationCode,
  setVerificationCode,
  onActivate,
  onClose,
  isLoading,
}: TwoFactorModalProps) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Настройка защиты</h3>
        <p>Отсканируйте QR в Aegis или Google Authenticator</p>

        <div className={styles.qrWrapper}>
          <img src={qrCode} alt="QR Code" width='200' height='200' />
        </div>

        <input
          type="text"
          maxLength={6}
          placeholder="000 000"
          value={verificationCode}
          onChange={(e) =>
            setVerificationCode(e.target.value.replace(/\D/g, ""))
          }
          className={styles.otpInput}
          autoFocus
        />

        <div className={styles.modalActions}>
          <Button
            onClick={onActivate}
            isLoading={isLoading}
            loadingText="Активация..."
          >
            Активировать
          </Button>

          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};
