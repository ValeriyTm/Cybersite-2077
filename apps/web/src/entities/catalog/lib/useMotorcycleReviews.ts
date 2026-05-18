import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/shared/api";

interface UseMotorcycleReviewsProps {
  motorcycleId?: string;
  slug?: string;
}

export const useMotorcycleReviews = ({
  motorcycleId,
  slug,
}: UseMotorcycleReviewsProps) => {
  const queryClient = useQueryClient();

  //Получение отзывов:
  const {
    data: reviews,
    // isLoading,
    // isError,
  } = useQuery({
    queryKey: ["reviews", motorcycleId],
    queryFn: () => $api.get(`/reviews/${motorcycleId}`).then((res) => res.data),
    enabled: !!motorcycleId,
  });

  //Удаление отзыва:
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => $api.delete(`/reviews/${reviewId}`),
    onSuccess: () => {
      //Сбрасываем кэш отзывов:
      queryClient.invalidateQueries({ queryKey: ["reviews", motorcycleId] });
      //Сбрасываем кэш мотоцикла для обновления рейтинга:
      queryClient.invalidateQueries({ queryKey: ["motorcycle", slug] });
    },
  });

  return {
    reviews,
    // isLoading,
    // isError,
    deleteReview: deleteReviewMutation.mutate,
    // isDeleting: deleteReviewMutation.isPending,
  };
};
