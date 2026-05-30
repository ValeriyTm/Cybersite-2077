import { useMutation } from "@tanstack/react-query";
//API:
import { $api } from "@/shared/api";
//Уведомления:
import toast from "react-hot-toast";
//Типы:
import type { DeliveryResponse } from "../types/types";
import type { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
}

interface CalculatePayload {
  lat: number;
  lng: number;
  items: { id: string; quantity: number }[];
}

export const useCalculateDelivery = (
  onSuccessCallback: (data: DeliveryResponse) => void,
) => {
  return useMutation<
    DeliveryResponse,
    AxiosError<ApiErrorResponse>,
    CalculatePayload
  >({
    mutationFn: async (payload: CalculatePayload) => {
      return $api
        .post<DeliveryResponse>("/warehouse/calculate", payload)
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      onSuccessCallback(data);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Ошибка при расчете доставки";
      toast.error(message);
    },
  });
};
