//Компоненты:
import { DownloadReportCard } from '@/features/reports/ui';
//Стили:
import styles from './AdminReportsPage.module.scss';

export const AdminReportsPage = () => {

  return (
    <div className={styles.pageWrapper}>
      <h3>Аналитическая отчетность</h3>
      <p className={styles.subtitle}>
        Выберите тип отчета для выгрузки данных за последние 30 дней
      </p>

      <div className={styles.reportsGrid}>
        <DownloadReportCard
          format="xlsx"
          title="Отчет по продажам (Excel)"
          description="Детальный список заказов, суммы, налоги и данные покупателей в табличном виде."
        />
        <DownloadReportCard
          format="pdf"
          title="Финансовая сводка (PDF)"
          description="Презентабельный документ с графиками, итоговыми суммами и динамикой продаж."
        />
      </div>
    </div>
  );
};