//Роутинг:
import { useNavigate } from 'react-router';
//Типы:
import { type ColumnDef } from "@tanstack/react-table";
//Иконки:
import { FaEdit, FaTrash, FaBox } from "react-icons/fa";
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from './columns.module.scss';
import { AdminButton } from '@/shared/ui';


export const getMotoColumns = (
  onEdit: (val: any) => void,
  onDelete: (id: string) => void,
  userRole: string | undefined,
): ColumnDef<any>[] => [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { className: styles.hideOnMobile },
      cell: ({ getValue, row }) => {
        const id = String(getValue());
        return (
          <div className={styles.idWrapper}>
            <code className={styles.code}>{id.slice(0, 8)}...</code>
            <button
              type="button"
              title={`Скопировать id товара для модели ${row.original.model}`}
              style={{ cursor: 'pointer' }}
              className={styles.copyBtn}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(id);
                toast.success('ID скопирован в буфер!');
              }}
            >
              <FaEdit size={12} />
            </button>
          </div>
        );
      }
    },
    {
      accessorKey: "model",
      header: "Модель",
      cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{row.original.model}</div>
          <div style={{ fontSize: "0.75rem", color: "#666" }}>
            {row.original.brand?.name}
          </div>
        </div>
      ),
    },
    { accessorKey: "category", header: "Категория", meta: { className: styles.hideOnMobile }, },
    {
      accessorKey: "price",
      header: "Цена",
      meta: { className: styles.hideOnMobileS },
      cell: (info) => `${info.getValue()?.toLocaleString()} ₽`,
    },
    { accessorKey: "year", header: "Год" },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => (
        <div className={styles.actionsWrapper}>
          {(userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
            <AdminButton variant="edit" title={`Редактировать модель ${row.original.model}`} onClick={() => onEdit(row.original)} />
          }


          {(userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
            <AdminButton variant="delete" title={`Удалить модель ${row.original.model}`} onClick={() => onDelete(row.original.id)} />

          }
        </div>
      ),
    },
    {
      id: 'stock',
      header: 'Склад',
      cell: ({ row }) => {
        const navigate = useNavigate();
        return (
          <>
            {(userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
              <AdminButton variant="stocks" title={`Редактировать остатки для модели ${row.original.model}`} onClick={() => navigate(`/admin/stocks?motoId=${row.original.id}`)} />
            }
          </>
        );
      }
    },
  ];
