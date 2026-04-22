import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { DataTable } from "@/shared/ui/DataTable/DataTable";
import { getMotoColumns } from "../model/columns";
import { MotoModal } from "./MotoModal";
import { toast } from "react-hot-toast";
import { debounce } from "lodash";
import styles from "./AdminMotorcyclesPage.module.scss";
import { useProfile } from "@/features/auth/model/useProfile";

export const AdminMotorcyclesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMoto, setEditingMoto] = useState(null);
  const queryClient = useQueryClient();

  const { user } = useProfile();
  const userRole = user?.role;

  //Стейт для мгновенного отображения в инпуте:
  const [searchValue, setSearchValue] = useState("");
  //Стейт, который триггерит запрос к API:
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  //Дебаунс-функция через useMemo, чтобы она не пересоздавалась:
  const updateSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
        setPage(1); //Сбрасываем страницу на первую при новом поиске
      }, 500),
    [],
  );

  //Обработчик ввода:
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value); //Для UI (печатается мгновенно)
    updateSearch(value); //Для API (сработает через 500мс)
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-motorcycles", page, debouncedSearch],
    queryFn: () =>
      $api
        .get("/admin/motorcycles", {
          params: {
            page,
            limit: 10,
            search: debouncedSearch, //Уходит на сервер для Elastic
          },
        })
        .then((res) => res.data),
    //Оптимизация: не делать запрос, если в поиске 1 символ:
    enabled: debouncedSearch.length === 0 || debouncedSearch.length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: (formData) =>
      editingMoto
        ? $api.patch(`/admin/motorcycles/${editingMoto.id}`, formData)
        : $api.post("/admin/motorcycles", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-motorcycles"] });
      setIsModalOpen(false);
      toast.success("Данные обновлены");
    },
  });

  const columns = getMotoColumns(
    (moto) => {
      setEditingMoto(moto);
      setIsModalOpen(true);

    },
    (id) => {
      if (confirm("Удалить байк?"))
        $api
          .delete(`/admin/motorcycles/${id}`)
          .then(() =>
            queryClient.invalidateQueries({ queryKey: ["admin-motorcycles"] }),
          );
    },
    userRole //Передаём роль третьим аргументом
  );

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h3>Каталог мотоциклов</h3>
        <input
          type="search"
          placeholder="🔍 Быстрый поиск..."
          value={searchValue}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        {(userRole == 'ADMIN' || userRole == 'SUPERADMIN' || userRole == 'MANAGER') &&
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditingMoto(null);
              setIsModalOpen(true);
            }}
          >
            + Добавить модель
          </button>}
      </header>

      <DataTable columns={columns} data={data?.data || []} />

      {isModalOpen && (
        <MotoModal
          moto={editingMoto}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data: any) => saveMutation.mutate(data)}

        />
      )}

      <div className={styles.paginationControls}>
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          ← Назад
        </button>

        <span>
          Страница <strong>{page}</strong> из {data?.meta?.lastPage || 1}
          (Всего: {data?.meta?.total})
        </span>

        <button
          disabled={page >= (data?.meta?.lastPage || 1)}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
};
