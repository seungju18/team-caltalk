import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore.ts";
import { useUiStore } from "../stores/uiStore.ts";
import { logError, queryClient } from "./queryClient.ts";
import type { FieldErrors } from "../lib/validation.ts";

// VITE_API_URL: 백엔드 주소(개발 http://localhost:3000, 운영은 백엔드 배포 주소). 프록시 없이 직접 호출한다
// withCredentials: 다른 출처에서도 Refresh 쿠키를 주고받는다
export const api = axios.create({
  baseURL: `${import.meta.env?.VITE_API_URL ?? ""}/api`,
  withCredentials: true,
});

export function resetSession(): void {
  useAuthStore.getState().clear();
  queryClient.clear();
  useUiStore.getState().reset();
}

// 동시에 여러 요청이 401 이어도 재발급은 1번만 (진행 중 Promise 공유)
let refreshing: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (refreshing) return refreshing;
  refreshing = api
    .post<{ accessToken: string }>("/auth/refresh")
    .then((res) => {
      useAuthStore.getState().setAccessToken(res.data.accessToken);
      return res.data.accessToken;
    })
    .catch((err) => {
      logError("refresh", err);
      resetSession();
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, async (err) => {
  const config = err.config as
    | (InternalAxiosRequestConfig & { _retry?: boolean })
    | undefined;
  if (
    err.response?.status !== 401 ||
    !config ||
    config._retry ||
    config.url?.startsWith("/auth/")
  )
    throw err;
  config._retry = true;
  await refreshAccessToken();
  return api(config);
});

export type ApiError = {
  status: number | null;
  message: string;
  fields: FieldErrors;
};

export function parseApiError(err: unknown): ApiError {
  if (!axios.isAxiosError(err))
    return { status: null, message: "요청을 처리하지 못했습니다", fields: {} };
  if (!err.response)
    return { status: null, message: "서버에 연결할 수 없습니다", fields: {} };
  const data = err.response.data as
    | { message?: string; errors?: { field: string; reason: string }[] }
    | undefined;
  const fields: FieldErrors = {};
  for (const e of data?.errors ?? []) fields[e.field] ??= e.reason;
  return {
    status: err.response.status,
    message: data?.message ?? "요청을 처리하지 못했습니다",
    fields,
  };
}
