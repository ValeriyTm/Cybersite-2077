import { Button } from "@/shared/ui";
//Стили:
import styles from "./TwoFactorAuthCard.module.scss";

interface TwoFactorAuthCardProps {
	is2FAEnabled: boolean;
	onSetup2FA: () => Promise<void> | void;
}

export const TwoFactorAuthCard = ({ is2FAEnabled, onSetup2FA }: TwoFactorAuthCardProps) => {
	return (
		<div className={styles.securityZone}>
			<h2>Администратор</h2>
			<div className={styles.actions}>
				<Button
					type="button"
					title="Двухфакторная аутентификация"
					variant="outline-dark"
					onClick={is2FAEnabled ? undefined : onSetup2FA}
					className={is2FAEnabled ? styles.enabled2FA : ''}
					loadingText="Включаем..."
				>
					{is2FAEnabled ? "2FA Активна ✅" : "Включить 2FA 🛡️"}
				</Button>
			</div>
		</div >
	);
};