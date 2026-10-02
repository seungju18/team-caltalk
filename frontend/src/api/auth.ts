import { api } from './client.ts'

export type User = { id: number; email: string; name: string }
export type TokenResponse = { accessToken: string }

export function signup(body: { email: string; password: string; name: string }): Promise<User> {
  return api.post<User>('/auth/signup', body).then((r) => r.data)
}

export function login(body: { email: string; password: string }): Promise<TokenResponse> {
  return api.post<TokenResponse>('/auth/login', body).then((r) => r.data)
}

export function logout(): Promise<void> {
  return api.post<void>('/auth/logout').then((r) => r.data)
}

// GIS 가 준 ID 토큰(credential)으로 로그인. 응답은 login 과 같다
export function googleLogin(credential: string): Promise<TokenResponse> {
  return api.post<TokenResponse>('/auth/google', { credential }).then((r) => r.data)
}
