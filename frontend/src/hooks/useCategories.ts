import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
  type Category,
} from "../api/categories";
import { parseApiError } from "../api/client";
import { useUiStore } from "../stores/uiStore";
import { validateCategoryName } from "../lib/validation";

// 입력란(name) 사유가 있으면 그것, 없으면 서버 문구
const nameError = (e: unknown) => {
  const { fields, message } = parseApiError(e);
  return fields.name ?? message;
};

export function useCategories() {
  const q = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  return {
    categories: q.data ?? [],
    isCategoriesLoading: q.isPending,
    categoriesError: q.error ? parseApiError(q.error).message : null,
  };
}

export function useCategoryManager() {
  const qc = useQueryClient();
  // 카테고리 이름이 할일 응답에도 들어 있어 둘 다 무효화한다
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["todos"] });
  };

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
    onError: (e) => setCreateError(nameError(e)),
  });
  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    const err = validateCategoryName(newName);
    setCreateError(err);
    if (!err) create.mutate(newName.trim());
  };

  const [editing, setEditing] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const rename = useMutation({
    mutationFn: (v: { id: number; name: string }) =>
      renameCategory(v.id, v.name),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
    // 실패 시 편집 상태·입력값 유지
    onError: (e) => setEditError(nameError(e)),
  });
  const startEdit = (c: Category) => {
    setEditing({ id: c.id, name: c.name });
    setEditError(null);
  };
  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const err = validateCategoryName(editing.name);
    setEditError(err);
    if (!err) rename.mutate({ id: editing.id, name: editing.name.trim() });
  };

  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_data, id) => {
      // SC-11 4a: 삭제한 카테고리가 목록 필터였으면 '전체'로
      const ui = useUiStore.getState();
      if (ui.categoryId === id) ui.setCategoryFilter(null);
      setDeleting(null);
      invalidate();
    },
    onError: () => {
      setDeleting(null);
      setDeleteError("삭제하지 못했습니다");
    },
  });

  return {
    newName,
    setNewName,
    createError,
    submitCreate,
    isCreating: create.isPending,
    editing,
    setEditName: (name: string) => setEditing((v) => (v ? { ...v, name } : v)),
    editError,
    startEdit,
    cancelEdit: () => setEditing(null),
    submitEdit,
    isRenaming: rename.isPending,
    deleting,
    askDelete: (c: Category) => {
      setDeleting(c);
      setDeleteError(null);
    },
    cancelDelete: () => setDeleting(null),
    confirmDelete: () => deleting && remove.mutate(deleting.id),
    isDeleting: remove.isPending,
    deleteError,
  };
}
