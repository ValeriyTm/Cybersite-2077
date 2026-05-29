import type { DragEvent, ChangeEvent } from "react";
//Навигация:
import { Link } from "react-router";
//Стили:
import styles from "./FileUpload.module.scss";

interface FileUploadProps {
	files: File[];
	setFiles: React.Dispatch<React.SetStateAction<File[]>>;
	isDragActive: boolean;
	setIsDragActive: (active: boolean) => void;
	isUserLoggedIn: boolean;
}

export const FileUpload = ({
	files,
	setFiles,
	isDragActive,
	setIsDragActive,
	isUserLoggedIn,
}: FileUploadProps) => {

	const handleDrag = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setIsDragActive(true);
		} else if (e.type === "dragleave") {
			setIsDragActive(false);
		}
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			setFiles(Array.from(e.dataTransfer.files));
		}
	};

	// Обработчик выбора через клик и проводник
	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFiles(Array.from(e.target.files || []));
	};

	// Удаление конкретного файла
	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	// Если пользователь не авторизован, показываем заглушку
	if (!isUserLoggedIn) {
		return (
			<div className={styles.fileUploadDisabled}>
				<p>
					🔒 <Link to="/auth">Войдите</Link>, чтобы прикрепить документы к обращению
				</p>
			</div>
		);
	}

	return (
		<div className={styles.fileUpload}>
			<label
				className={`${styles.fileLabel} ${isDragActive ? styles.dragActive : ""}`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<input
					type="file"
					multiple
					onChange={handleFileChange}
					accept=".jpg,.png,.pdf,.doc,.docx,.txt"
				/>
				<div className={styles.icon}>{isDragActive ? "📥" : "📎"}</div>
				<span>Нажмите или перетащите файлы сюда</span>
			</label>

			{/* Блок предпросмотра */}
			{files.length > 0 && (
				<div className={styles.previewGrid}>
					{files.map((file, index) => (
						<div key={index} className={styles.previewItem}>
							<div className={styles.previewContent}>
								{file.type.startsWith("image/") ? (
									<img
										src={URL.createObjectURL(file)}
										alt="preview for user's image"
										className={styles.thumb}
										width="100"
										height="100"
									/>
								) : (
									<div className={styles.fileIcon}>📄</div>
								)}
								<span className={styles.fileName}>{file.name}</span>
							</div>
							<button
								type="button"
								className={styles.removeBtn}
								onClick={() => removeFile(index)}
							>
								✕
							</button>
						</div>
					))}
				</div>
			)}

			<p className={styles.fileCount}>
				Прикреплено файлов: <strong>{files.length}</strong>
			</p>
		</div>
	);
};
