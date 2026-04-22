//Типы:
import { type ColumnDef } from "@tanstack/react-table";
//Иконки:
import { FaEdit, FaTrash } from "react-icons/fa";
//Стили:
import styles from './columns.module.scss';

// export const getColumns = (
//   onDelete: (id: string) => void,
//   onEdit: (brand: any) => void,
// ): ColumnDef<any>[] => [
//     {
//       accessorKey: "name",
//       header: "Название бренда",
//       cell: (info) => (
//         <strong style={{ color: "#fff" }}>{String(info.getValue())}</strong>
//       ),
//     },
//     {
//       accessorKey: "country",
//       header: "Страна",
//     },
//     {
//       id: "actions",
//       header: "Действия",
//       cell: ({ row }) => (
//         <div style={{ display: "flex", gap: "15px", color: "#f39c12" }}>
//           <button
//             type="button"
//             onClick={() => onEdit(row.original)}
//             style={{
//               background: "none",
//               border: "none",
//               padding: 0,
//               cursor: "pointer",
//               color: "#f39c12"
//             }}
//             aria-label="Редактировать бренд"
//           >
//             <FaEdit title="Редактировать" />
//           </button>
//           <FaTrash
//             cursor="pointer"
//             title="Удалить"
//             style={{ color: "#e74c3c" }}
//             onClick={() => {
//               if (
//                 window.confirm(
//                   "Удалить этот бренд? Это удалит из базы все мотоциклы этого бренда",
//                 )
//               ) {
//                 onDelete(row.original.id);
//               }
//             }}
//           />
//         </div>
//       ),
//     },
//   ];

export const getColumns = (
  onDelete: (id: string) => void,
  onEdit: (brand: any) => void,
): ColumnDef<any>[] => [
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
      cell: ({ row }) => {
        const brandName = row.original.name;

        return (
          <div className={styles.actionsContainer}>
            <button
              type="button"
              title={`Редактировать бренд ${brandName}`}
              className={`${styles.actionButton} ${styles.editBtn}`}
              onClick={() => onEdit(row.original)}
            >
              <FaEdit />
            </button>

            <button
              type="button"
              className={`${styles.actionButton} ${styles.deleteBtn}`}
              onClick={() => {
                if (window.confirm(`Удалить бренд ${brandName}? Это удалит все его мотоциклы.`)) {
                  onDelete(row.original.id);
                }
              }}
              title={`Удалить бренд ${brandName}`}
            >
              <FaTrash />
            </button>
          </div>
        );
      }
    },
  ];
