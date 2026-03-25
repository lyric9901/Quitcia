import { create } from 'zustand';

interface AppState {
  hasActiveUrge: boolean;
  setHasActiveUrge: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasActiveUrge: false,
  setHasActiveUrge: (status) => set({ hasActiveUrge: status }),
}));