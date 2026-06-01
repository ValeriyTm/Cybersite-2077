import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrivacyState {
  isAccepted: boolean; //Принято ли согласие с условиями
  acceptPrivacy: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      isAccepted: false,
      acceptPrivacy: () => set({ isAccepted: true }),
    }),
    {
      name: "privacy-consent", //Ключ в LocalStorage
    },
  ),
);
