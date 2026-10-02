import { api } from "./client.ts";
import type { TokenResponse, User } from "./auth.ts";

export function getMe(): Promise<User> {
  return api.get<User>("/users/me").then((r) => r.data);
}

export function updateMe(body: { name: string }): Promise<User> {
  return api.patch<User>("/users/me", body).then((r) => r.data);
}

export function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<TokenResponse> {
  return api.put<TokenResponse>("/users/me/password", body).then((r) => r.data);
}
