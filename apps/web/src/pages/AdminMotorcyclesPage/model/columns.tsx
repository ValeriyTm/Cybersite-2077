import { type ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash, FaBox } from "react-icons/fa";
import { useNavigate } from 'react-router';

export const getMotoColumns = (
  onEdit: (val: any) => void,
  onDelete: (id: string) => void,
): ColumnDef<any>[] => [
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
    { accessorKey: "category", header: "Категория" },
    {
      accessorKey: "price",
      header: "Цена",
      cell: (info) => `${info.getValue()?.toLocaleString()} ₽`,
    },
    { accessorKey: "year", header: "Год" },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: "12px" }}>
          <FaEdit
            color="#f39c12"
            cursor="pointer"
            onClick={() => onEdit(row.original)}
          />
          <FaTrash
            color="#e74c3c"
            cursor="pointer"
            onClick={() => onDelete(row.original.id)}
          />
        </div>
      ),
    },
    {
      id: 'stock',
      header: 'Склад',
      cell: ({ row }) => {
        const navigate = useNavigate();
        return (
          <FaBox
            cursor="pointer"
            color="#3498db" // Синий цвет для отличия от редактирования
            title="Управление запасами"
            onClick={() => navigate(`/admin/stocks?motoId=${row.original.id}`)}
          />
        );
      }
    },
  ];
