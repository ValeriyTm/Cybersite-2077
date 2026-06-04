//Типы:
import { type ColumnDef } from "@tanstack/react-table";
import type { MotorcycleEditAdmin } from "@/entities/catalog";
//Компоненты:
import { AdminButton } from '@/shared/ui';
//Уведомления:
import toast from "react-hot-toast";
//Стили:
import styles from './columns.module.scss';


export const getMotoColumns = (
  onEdit: (val: MotorcycleEditAdmin) => void,
  onDelete: (id: string) => void,
  userRole: string,
  // navigate: (path: string) => void,
  onNavigateToStock: (id: string) => void,
): ColumnDef<MotorcycleEditAdmin>[] => [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { className: styles.hideOnMobile },
      cell: ({ getValue, row }) => {
        const id = String(getValue());
        return (
          <div className={styles.idWrapper}>
            <code className={styles.code}>{id.slice(0, 8)}...</code>
            <AdminButton variant="copy" title={`Скопировать id товара для модели ${row.original.model}`} onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(id);
              toast.success('ID скопирован в буфер!');
            }} />

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
    { accessorKey: "category", header: "Категория", meta: { className: styles.hideOnTablet }, },
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
          {(['MANAGER', 'ADMIN', 'SUPERADMIN', 'WATCHER'].includes(userRole)) &&
            <AdminButton variant="edit" title={`Редактировать модель ${row.original.model}`} onClick={() => onEdit(row.original)} />
          }
          {(['MANAGER', 'ADMIN', 'SUPERADMIN', 'WATCHER'].includes(userRole)) &&
            <AdminButton variant="delete" title={`Удалить модель ${row.original.model}`} onClick={() => onDelete(row.original.id)} />

          }
        </div>
      ),
    },
    {
      id: 'stock',
      header: 'Склад',
      cell: ({ row }) => {
        return (
          <>
            {(['MANAGER', 'ADMIN', 'SUPERADMIN', 'WATCHER'].includes(userRole)) &&
              <AdminButton variant="stocks" title={`Редактировать остатки для модели ${row.original.model}`} onClick={() => onNavigateToStock(row.original.id)} />
            }
          </>
        );
      }
    },
  ];
