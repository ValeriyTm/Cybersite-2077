import styles from "./TwoFactorAuthCard.module.scss";

interface TwoFactorAuthCardProps {
	is2FAEnabled: boolean;
	onSetup2FA: () => Promise<void> | void;
}

export const TwoFactorAuthCard = ({ is2FAEnabled, onSetup2FA }: TwoFactorAuthCardProps) => {
	return (
		<div className={styles.securityZone}>
			<h2>Администратор</h2>
			<button
				type="button"
				title="Двухфакторная аутентификация"
				onClick={is2FAEnabled ? undefined : onSetup2FA}
				className={is2FAEnabled ? styles.enabled2FA : ''}
				disabled={is2FAEnabled}
			>
				{is2FAEnabled ? "2FA Активна ✅" : "Включить 2FA 🛡️"}
			</button>
		</div>
	);
};