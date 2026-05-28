//Компоненты:
import { AdminButton } from "@/shared/ui";
//Типы:
import { type ColumnDef } from "@tanstack/react-table";
import type { Brand } from "@repo/database/generated/prisma/client";
//Стили:
import styles from './columns.module.scss';

export const getColumns = (
  onDelete: (id: string) => void,
  onEdit: (brand: Brand) => void,
): ColumnDef<Brand>[] => [
    {
      accessorKey: "name",
      header: "Название бренда",
      cell: (info) => (
        <strong className={styles.title}>{String(info.getValue())}</strong>
      ),
    },
    {
      accessorKey: "country",
      header: "Страна",
    },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => {
        const brandName = row.original.name;

        return (
          <div className={styles.actionsContainer}>
            <AdminButton variant="edit" title={`Редактировать бренд ${brandName}`} onClick={() => onEdit(row.original)} />

            <AdminButton variant="delete" title={`Удалить бренд ${brandName}`} onClick={() => {
              if (window.confirm(`Удалить бренд ${brandName}? Это удалит все его мотоциклы.`)) {
                onDelete(row.original.id);
              }
            }} />
          </div>
        );
      }
    },
  ];
