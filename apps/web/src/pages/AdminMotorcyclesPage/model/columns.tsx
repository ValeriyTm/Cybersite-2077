import { type ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash, FaBox, FaCopy } from "react-icons/fa";
import { useNavigate } from 'react-router';
import toast from "react-hot-toast";


export const getMotoColumns = (
  onEdit: (val: any) => void,
  onDelete: (id: string) => void,
  userRole: string | undefined,
): ColumnDef<any>[] => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => {
        const id = String(getValue());
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code style={{ color: '#666', fontSize: '0.75rem' }}>{id.slice(0, 8)}...</code>
            <FaCopy
              cursor="pointer"
              color="#555"
              size={12}
              title="Копировать полный ID"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(id);
                toast.success('ID скопирован в буфер!');
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f39c12'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#555'}
            />
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
          {(userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
            <FaEdit
              color="#f39c12"
              cursor="pointer"
              onClick={() => onEdit(row.original)}
            />}
          {(userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
            <FaTrash
              color="#e74c3c"
              cursor="pointer"
              onClick={() => onDelete(row.original.id)}
            />}
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
              <FaBox
                cursor="pointer"
                color="#3498db" // Синий цвет для отличия от редактирования
                title="Управление запасами"
                onClick={() => navigate(`/admin/stocks?motoId=${row.original.id}`)}
              />}
          </>
        );
      }
    },
  ];
