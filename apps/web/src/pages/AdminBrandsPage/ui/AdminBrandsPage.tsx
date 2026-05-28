//Состояния:
import { useAdminBrands } from "@/entities/admin";
import { useCallback, useMemo, useState } from "react";
import { useAdminBrandDelete, useAdminBrandSave } from "@/features/admin";
//Компоненты:
import { BrandModal } from "./BrandModal";
import { Button, DataTable, Pagination } from "@/shared/ui";
import { getColumns } from "../model/columns";
//Типы:
import { type BrandData } from "@/entities/catalog";
//Стили:
import styles from "./AdminBrandsPage.module.scss";

export const AdminBrandsPage = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandData | null>(null);

  //Получаем бренды:
  const { data, isLoading, error } = useAdminBrands(page);

  //Удаление бренда:
  const deleteMutation = useAdminBrandDelete();

  //Создание или обновление бренда:
  const saveMutation = useAdminBrandSave({
    editingBrand,
    setIsModalOpen,
    setEditingBrand,
  });


  //Оборачиваем handleEdit в useCallback, т.к. этого требует использование useMemo в getColumns:
  const handleEdit = useCallback((brand: BrandData) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  }, []); // Пустой массив, так как функции set стабильны

  //Передаем функцию удаления в генератор колонок:
  const columns = useMemo(() => getColumns(
    (id) => deleteMutation.mutate(id),
    (brand) => handleEdit(brand),
  ), [deleteMutation, handleEdit]);
  //Обернул в useMemo, чтобы не происходил ререндер при пагинации

  if (isLoading) return <div className={styles.loader}>Загрузка данных...</div>;
  if (error)
    return <div className={styles.error}>Ошибка при загрузке брендов</div>;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h3>Управление брендами</h3>
        <Button
          type="button"
          variant="outline-dark"
          onClick={() => {
            setEditingBrand(null);
            setIsModalOpen(true);
          }}
        >
          + Новый бренд
        </Button>
      </header>

      <DataTable columns={columns} data={data?.data || []} />

      {/* Пагинация: */}
      <Pagination
        currentPage={page}
        totalPages={data?.meta?.lastPage || 1}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {isModalOpen && (
        <BrandModal
          brand={editingBrand}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data: BrandData) => {
            saveMutation.mutate(data)
          }
          }
        />
      )}
    </div>
  );
};
