//Состояния:
import { useState, useMemo, useCallback } from "react";
import { useProfile } from "@/features/auth";
import { useAdminMotorcycles } from "@/entities/admin";
import { useAdminMotorcycleDelete, useAdminMotorcycleSave } from "@/features/admin";
//Навигация:
import { useNavigate } from "react-router";
//Формирование таблицы:
import { ActionConfirmModal, DataTable, Pagination } from "@/shared/ui";
import { getMotoColumns } from "../model";
//Компоненты:
import { MotoModal } from "./components";
import { AdminMotorcyclesHeader } from "./components";
//Типы:
import type { MotorcycleEditAdmin } from "@/entities/catalog";
//Дебанус поиска:
import { debounce } from "lodash";
//Стили:
import styles from "./AdminMotorcyclesPage.module.scss";

export const AdminMotorcyclesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMoto, setEditingMoto] = useState<null | MotorcycleEditAdmin>(null);
  const [motoIdToDelete, setMotoIdToDelete] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");   //Стейт для мгновенного отображения в инпуте
  const [debouncedSearch, setDebouncedSearch] = useState(""); //Стейт, который триггерит запрос к API
  const [page, setPage] = useState(1);

  const { user } = useProfile();
  const userRole = user?.role;

  const navigate = useNavigate();

  //Получаем мотоциклы:
  const { data } = useAdminMotorcycles(page, debouncedSearch);
  //Мутация удаления:
  const deleteMutation = useAdminMotorcycleDelete();
  //Мутация создания/обновления:
  // const saveMutation = useAdminMotorcycleSave({ editingMoto, setIsModalOpen });
  const { mutate, isPending } = useAdminMotorcycleSave({ editingMoto, setIsModalOpen });
  //Дебаунс-функция:
  const updateSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
        setPage(1); //Сбрасываем страницу на первую при новом поиске
      }, 500),
    [],
  );

  //---------------Обработчики:---------------//
  //Обработчик ввода:
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value); //Для UI (печатается мгновенно)
    updateSearch(value); //Для API (сработает через 500мс)
  };


  //Срабатывает при клике на иконку удаления в таблице:
  const handleRequestDelete = useCallback((id: string) => {
    setMotoIdToDelete(id);
  }, []);

  //Срабатывает при клике на иконку удаления в модалке:
  const handleConfirmDelete = useCallback(() => {
    if (motoIdToDelete) {
      deleteMutation.mutate(motoIdToDelete, {
        onSuccess: () => {
          setMotoIdToDelete(null);
        }
      });
    }
  }, [motoIdToDelete, deleteMutation]);

  //Обработчик открытия модалки для создания нового мотоцикла:
  const handleAddClick = useCallback(() => {
    setEditingMoto(null);
    setIsModalOpen(true);
  }, []);

  //-------------Построение таблицы:-----//
  // Создаем стабильный колбэк для навигации на склад
  const handleNavigateToStock = useCallback((id: string) => {
    navigate(`/admin/stocks?motoId=${id}`);
  }, [navigate]);

  const columns = useMemo(() =>
    getMotoColumns(
      (moto: MotorcycleEditAdmin) => {
        setEditingMoto(moto);
        setIsModalOpen(true);
      },//Edit
      (id) => handleRequestDelete(id), //Delete
      userRole!,
      handleNavigateToStock
    ),
    [handleRequestDelete, userRole, handleNavigateToStock]
  );

  return (
    <div className={styles.pageWrapper}>
      <AdminMotorcyclesHeader
        searchValue={searchValue}
        onChangeSearch={handleSearchChange}
        userRole={userRole}
        onAddClick={handleAddClick}
      />

      <DataTable columns={columns} data={data?.data || []} />

      {isModalOpen && (
        <MotoModal
          moto={editingMoto as MotorcycleEditAdmin}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => {
            mutate(data)
          }}
          isOpen={isModalOpen}
          isPending={isPending}
        />
      )}

      <ActionConfirmModal
        isOpen={motoIdToDelete !== null}
        title="Удаление мотоцикла"
        description="Вы уверены, что хотите удалить этот байк? Это действие невозможно отменить."
        variant="danger"
        confirmText="Удалить"
        cancelText="Отмена"
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMotoIdToDelete(null)}
      />

      {/* Пагинация: */}
      <Pagination
        currentPage={page}
        totalPages={data?.meta?.lastPage || 1}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};
