import { useState } from "react";
//Уведомления:
import toast from "react-hot-toast";
//API:
import { $api } from "@/shared/api";

export const useDownloadReport = (format: "pdf" | "xlsx") => {
  const [isLoading, setIsLoading] = useState(false);

  const downloadReport = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      toast.loading("Подготовка отчета...", { id: "report" });

      const response = await $api.get("/admin/reports/download", {
        params: { format },
        responseType: "blob",
      });

      const blobType =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: blobType }),
      );
      const link = document.createElement("a");
      link.href = url;

      const fileName = `sales-report-${new Date().toLocaleDateString()}.${format}`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Отчет готов!", { id: "report" });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Ошибка при скачивании отчета", { id: "report" });
    } finally {
      setIsLoading(false);
    }
  };

  return { downloadReport, isLoading };
};
