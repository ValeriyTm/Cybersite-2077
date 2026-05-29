//Иконки:
import { FaEdit, FaTrash, FaBox, FaCopy, FaReply } from 'react-icons/fa';
//Стили:
import styles from './AdminButton.module.scss';

const iconMap = {
  edit: <FaEdit />,
  delete: <FaTrash />,
  stocks: <FaBox />,
  copy: <FaCopy />,
  reply: <FaReply />
};

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "edit" | "delete" | "stocks" | "copy" | "reply";
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
