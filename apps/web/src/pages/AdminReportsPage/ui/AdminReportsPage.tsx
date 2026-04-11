import { FaFilePdf, FaFileExcel, FaChartLine } from 'react-icons/fa';
import styles from './AdminReportsPage.module.scss';
import { $api } from '@/shared/api/api';
import toast from 'react-hot-toast';

export const AdminReportsPage = () => {

    const handleDownload = async (format: 'pdf' | 'xlsx') => {
        try {
            toast.loading('Подготовка отчета...', { id: 'report' });

            //1) Делаем запрос через наш инстанс axios ($api); указываем responseType: 'blob', чтобы axios не пытался парсить файл как JSON
            const response = await $api.get('/admin/reports/download', {
                params: { format },
                responseType: 'blob',
            });

            const blobType = format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/pdf';

            //2) Создаем временную ссылку на полученный двоичный объект (Blob):
            const url = window.URL.createObjectURL(new Blob([response.data], { type: blobType }));
            const link = document.createElement('a');
            link.href = url;

            //3) Задаем имя файла:
            const fileName = `sales-report-${new Date().toLocaleDateString()}.${format}`;
            link.setAttribute('download', fileName);

            //4) Инициируем скачивание:
            document.body.appendChild(link);
            link.click();

            //5) Чистим за собой:
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Отчет готов!', { id: 'report' });
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Ошибка при скачивании отчета', { id: 'report' });
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <h3>Аналитическая отчетность</h3>
            <p className={styles.subtitle}>Выберите тип отчета для выгрузки данных за последние 30 дней</p>

            <div className={styles.reportsGrid}>
                {/*Карточка Excel:*/}
                <div className={styles.reportCard}>
                    <div className={styles.iconWrapper} style={{ background: '#1d6f42' }}>
                        <FaFileExcel size={40} />
                    </div>
                    <div className={styles.cardInfo}>
                        <h4>Отчет по продажам (Excel)</h4>
                        <p>Детальный список заказов, суммы, налоги и данные покупателей в табличном виде.</p>
                        <button onClick={() => handleDownload('xlsx')}>Скачать .XLSX</button>
                    </div>
                </div>

                {/*Карточка PDF:*/}
                <div className={styles.reportCard}>
                    <div className={styles.iconWrapper} style={{ background: '#c0392b' }}>
                        <FaFilePdf size={40} />
                    </div>
                    <div className={styles.cardInfo}>
                        <h4>Финансовая сводка (PDF)</h4>
                        <p>Презентабельный документ с графиками, итоговыми суммами и динамикой продаж.</p>
                        <button onClick={() => handleDownload('pdf')}>Скачать .PDF</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
