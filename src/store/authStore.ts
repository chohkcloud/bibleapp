import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isPasswordSet: boolean;
  isBiometricEnabled: boolean;
  setAuthenticated: (value: boolean) => void;
  setPasswordSet: (value: boolean) => void;
  setBiometricEnabled: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isPasswordSet: false,
  isBiometricEnabled: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setPasswordSet: (value) => set({ isPasswordSet: value }),
  setBiometricEnabled: (value) => set({ isBiometricEnabled: value }),
  logout: () => set({ isAuthenticated: false }),
}));
