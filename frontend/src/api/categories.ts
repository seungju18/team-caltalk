import { api } from "./client.ts";

export type Category = { id: number; name: string; isDefault: boolean };

export function listCategories(): Promise<Category[]> {
  return api.get<Category[]>("/categories").then((r) => r.data);
}

export function createCategory(name: string): Promise<Category> {
  return api.post<Category>("/categories", { name }).then((r) => r.data);
}

export function renameCategory(id: number, name: string): Promise<Category> {
  return api.patch<Category>(`/categories/${id}`, { name }).then((r) => r.data);
}

export function deleteCategory(id: number): Promise<void> {
  return api.delete<void>(`/categories/${id}`).then((r) => r.data);
}
