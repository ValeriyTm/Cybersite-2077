import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/shared/api/api";
import { DataTable } from "@/shared/ui/DataTable/DataTable";
import { getMotoColumns } from "../model/columns";
import { MotoModal } from "./MotoModal";
import { toast } from "react-hot-toast";
import styles from "./AdminMotorcyclesPage.module.scss";

export const AdminMotorcyclesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMoto, setEditingMoto] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-motorcycles"],
    queryFn: () => $api.get("/admin/motorcycles").then((res) => res.data),
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
  );

  return (
    <div className={styles.pageWrapper}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>Каталог мотоциклов</h3>
        <button
          className={styles.addBtn}
          onClick={() => {
            setEditingMoto(null);
            setIsModalOpen(true);
          }}
        >
          + Добавить модель
        </button>
      </header>

      <DataTable columns={columns} data={data?.data || []} />

      {isModalOpen && (
        <MotoModal
          moto={editingMoto}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data: any) => saveMutation.mutate(data)}
        />
      )}
    </div>
  );
};
