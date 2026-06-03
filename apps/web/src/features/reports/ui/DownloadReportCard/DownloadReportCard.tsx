import { useDownloadReport } from '../../api';
//Компоненты:
import { Button } from '@/shared/ui';
//Иконки:
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
//Стили:
import styles from './DownloadReportCard.module.scss';

interface DownloadReportCardProps {
  format: 'pdf' | 'xlsx';
  title: string;
  description: string;
  isRestricted?: boolean;
}

export const DownloadReportCard = ({ format, title, description, isRestricted = false }: DownloadReportCardProps) => {
  const { downloadReport, isLoading } = useDownloadReport(format);

  const isExcel = format === 'xlsx';
  const iconBg = isExcel ? '#1d6f42' : '#c0392b';
  const Icon = isExcel ? FaFileExcel : FaFilePdf;

  return (
    <div className={styles.reportCard}>
      <div className={styles.iconWrapper} style={{ background: iconBg }}>
        <Icon size={40} />
      </div>
      <div className={styles.cardInfo}>
        <h4>{title}</h4>
        <p>{description}</p>
        <Button
          type="button"
          disabled={isRestricted}
          variant="outline"
          onClick={downloadReport}
          isLoading={isLoading}
        >
          Скачать .{format.toUpperCase()}
        </Button>
      </div>
    </div>
  );
};


