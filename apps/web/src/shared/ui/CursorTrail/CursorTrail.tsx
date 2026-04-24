//Состояния:
import { useEffect, useState } from "react";
//Стили:
import styles from "./CursorTrail.module.scss";

export const CursorTrail = () => {
  const [dots, setDots] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setDots((prev) => {
        const newDot = { x: e.clientX, y: e.clientY, id: Math.random() };
        //Ограничиваем количество: берем последние 10 штук + новая
        const limited = prev.length > 10 ? prev.slice(-10) : prev;
        return [...limited, newDot];
      });
    };

    //Таймер для удаления по времени (каждые 50мс удаляем первую точку)
    const timer = setInterval(() => {
      setDots((prev) => (prev.length > 0 ? prev.slice(1) : prev));
    }, 50);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {dots.map((dot, index) => (
        <div
          key={dot.id}
          className={styles.dot}
          style={{
            left: dot.x,
            top: dot.y,
            //Масштаб и прозрачность зависят от позиции в очереди:
            opacity: index / dots.length,
            transform: `scale(${index / dots.length})`,
          }}
        />
      ))}
    </>
  );
};