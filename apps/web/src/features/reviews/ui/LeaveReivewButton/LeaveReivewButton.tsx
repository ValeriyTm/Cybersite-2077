import { useState } from "react";
//Компоненты:
import { Button } from "@/shared/ui";
import { ReviewModal } from "@/features/reviews";
//Типы:
import type { OrderItem } from "@/entities/ordering/types/types";

interface LeaveReviewButtonProps {
  orderId: string;
  item: OrderItem;
  isCompleted: boolean;
}

export const LeaveReviewButton = ({ orderId, item, isCompleted }: LeaveReviewButtonProps) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  if (!isCompleted) return null;

  return (
    <>
      <Button
        type="button"
        variant="review"
        disabled={item.isReviewed}
        onClick={() => setIsReviewModalOpen(true)}
        bold
      >
        {item.isReviewed ? "Отзыв оставлен ✓" : "Оставить отзыв"}
      </Button>

      {isReviewModalOpen && (
        <ReviewModal
          orderId={orderId}
          item={item}
          isReviewModalOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}
    </>
  );
};
