import { create } from 'zustand'

// Access Token 은 메모리에만 둔다. 로그인 여부 = accessToken !== null
type AuthState = {
  accessToken: string | null
  setAccessToken(t: string): void
  clear(): void
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null }),
}))
