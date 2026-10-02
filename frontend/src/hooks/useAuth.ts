import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { googleLogin, login, logout, signup } from "../api/auth";
import { parseApiError, refreshAccessToken, resetSession } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";
import { validateSignup, type FieldErrors } from "../lib/validation";
import { useGoogleButton } from "./useGoogleButton";

// 앱 시작 시 Refresh 쿠키로 재발급 1회. 성공하면 메인, 실패하면 로그인 그대로
export function useRestoreSession() {
  const [isRestoring, setRestoring] = useState(true);
  const setPage = useUiStore((s) => s.setPage);
  useEffect(() => {
    refreshAccessToken()
      .then(() => setPage("main"))
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, [setPage]);
  return { isRestoring };
}

export function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const notice = useUiStore((s) => s.notice);
  const setPage = useUiStore((s) => s.setPage);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  // 이메일·비밀번호와 Google 로그인이 성공 처리·오류 자리를 함께 쓴다
  const mutation = useMutation({
    mutationFn: (
      v: { email: string; password: string } | { credential: string },
    ) => ("credential" in v ? googleLogin(v.credential) : login(v)),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setPage("main");
    },
    // BR-14: 이메일은 유지, 비밀번호만 비운다
    onError: () => setPassword(""),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email: email.trim(), password });
  };
  const { googleRef, hasGoogle } = useGoogleButton((credential) =>
    mutation.mutate({ credential }),
  );
  return {
    googleRef,
    hasGoogle,
    email,
    setEmail,
    password,
    setPassword,
    submit,
    isLoggingIn: mutation.isPending,
    loginError: mutation.error ? parseApiError(mutation.error).message : null,
    notice,
  };
}

type SignupValues = { email: string; password: string; name: string };

export function useSignup() {
  const [values, setValues] = useState<SignupValues>({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const setPage = useUiStore((s) => s.setPage);
  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: () => setPage("login", "가입이 완료되었습니다. 로그인하세요"),
    onError: (e) => {
      const { fields, message } = parseApiError(e);
      setErrors(fields);
      // 입력란에 매핑할 사유가 없으면 1줄 문구
      setFormError(Object.keys(fields).length > 0 ? null : message);
    },
  });
  const setField = (k: keyof SignupValues, v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateSignup(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    mutation.mutate({
      email: values.email.trim(),
      password: values.password,
      name: values.name.trim(),
    });
  };
  return {
    values,
    setField,
    submit,
    isSigningUp: mutation.isPending,
    errors,
    formError,
  };
}

export function useLogout() {
  const mutation = useMutation({ mutationFn: logout, onSettled: resetSession });
  return { logout: () => mutation.mutate(), isLoggingOut: mutation.isPending };
}
