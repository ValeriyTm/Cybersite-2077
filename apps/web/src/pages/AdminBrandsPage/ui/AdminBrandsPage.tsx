//Состояния:
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
//API:
import { $api } from "@/shared/api";
//Компоненты:
import { BrandModal } from "./BrandModal";
import { DataTable } from "@/shared/ui";
import { getColumns } from "../model/columns";
//Уведомления:
import { toast } from "react-hot-toast";
//Стили:
import styles from "./AdminBrandsPage.module.scss";

export const AdminBrandsPage = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const queryClient = useQueryClient();

  //Запрос с учетом страницы:
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-brands", page],
    queryFn: () =>
      $api.get(`/admin/brands?page=${page}`).then((res) => res.data),
  });

  //Мутация удаления:
  const deleteMutation = useMutation({
    mutationFn: (id: string) => $api.delete(`/admin/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] }); //Обновляем таблицу
      toast.success("Бренд удален");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });

  //Мутация для сохранения (создание или апдейт):
  const saveMutation = useMutation({
    mutationFn: (formData: any) =>
      editingBrand
        ? $api.patch(`/admin/brands/${editingBrand.id}`, formData)
        : $api.post("/admin/brands", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      setIsModalOpen(false);
      setEditingBrand(null);
      toast.success("Успешно сохранено");
    },
  });

  //Прокидываем функцию редактирования в колонки:
  const handleEdit = (brand: any) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  //Передаем функцию удаления в генератор колонок:
  const columns = getColumns(
    (id) => deleteMutation.mutate(id), // onDelete
    (brand) => handleEdit(brand), // onEdit
  );

  if (isLoading) return <div className={styles.loader}>Загрузка данных...</div>;
  if (error)
    return <div className={styles.error}>Ошибка при загрузке брендов</div>;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h3>Управление брендами</h3>
        <button
          className={styles.addBtn}
          onClick={() => {
            setEditingBrand(null);
            setIsModalOpen(true);
          }}
        >
          + Новый бренд
        </button>
      </header>


      <DataTable columns={columns} data={data?.data || []} />

      {/* Пагинация: */}
      <div className={styles.paginationControls}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {data?.meta?.lastPage || 1}
        </span>
        <button
          disabled={page === data?.meta?.lastPage}
          onClick={() => setPage((p) => p + 1)}
        >
          Вперёд
        </button>
      </div>

      {isModalOpen && (
        <BrandModal
          brand={editingBrand}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data: any) => saveMutation.mutate(data)}
        />
      )}
    </div>
  );
};
