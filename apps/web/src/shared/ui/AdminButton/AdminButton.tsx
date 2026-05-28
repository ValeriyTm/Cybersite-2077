//Иконки:
import { FaEdit, FaTrash, FaBox } from 'react-icons/fa';
//Стили:
import styles from './AdminButton.module.scss';

const iconMap = {
  edit: <FaEdit />,
  delete: <FaTrash />,
  stocks: <FaBox />
};

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "edit" | "delete" | "stocks";
}

export const AdminButton = ({
  variant,
  ...props
}: AdminButtonProps) => {

  const buttonClass = `${styles.actionButton} ${styles[variant]}`;

  return (
    <button
      type="button"
      className={buttonClass}
      {...props}
    >
      {iconMap[variant]}
    </button>
  );
};
