import { type ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash } from "react-icons/fa";

export const getColumns = (
  onDelete: (id: string) => void,
  onEdit: (brand: any) => void,
): ColumnDef<any>[] => [
    // {
    //   accessorKey: "id",
    //   header: "ID",
    //   cell: (info) => (
    //     <code style={{ color: "#666" }}>
    //       {String(info.getValue()).slice(0, 8)}...
    //     </code>
    //   ),
    // },
    {
      accessorKey: "name",
      header: "Название бренда",
      cell: (info) => (
        <strong style={{ color: "#fff" }}>{String(info.getValue())}</strong>
      ),
    },
    {
      accessorKey: "country",
      header: "Страна",
    },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: "15px", color: "#f39c12" }}>
          <FaEdit
            cursor="pointer"
            title="Редактировать"
            style={{ color: "#f39c12" }}
            onClick={() => onEdit(row.original)} // 🎯 Передаем объект бренда целиком
          />
          <FaTrash
            cursor="pointer"
            title="Удалить"
            style={{ color: "#e74c3c" }}
            onClick={() => {
              if (
                window.confirm(
                  "Удалить этот бренд? Это удалит из базы все мотоциклы этого бренда",
                )
              ) {
                onDelete(row.original.id);
              }
            }}
          />
        </div>
      ),
    },
  ];
