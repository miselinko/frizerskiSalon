import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  admin: { id: string; name: string; email: string } | null;
  setToken: (token: string) => void;
  setAdmin: (admin: { id: string; name: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setToken: (token) => set({ token }),
      setAdmin: (admin) => set({ admin }),
      logout: () => set({ token: null, admin: null }),
    }),
    { name: "salon-auth" }
  )
);
