import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changePassword, getMe, updateMe } from '../api/users'
import { parseApiError } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { validateName, validatePassword, type FieldErrors } from '../lib/validation'

// 입력란에 매핑할 사유가 없으면(404·네트워크 등) 1줄 문구
function toErrors(e: unknown, keys: string[]): FieldErrors {
  const { fields, message } = parseApiError(e)
  return keys.some((k) => fields[k]) ? fields : { form: message }
}

export function useProfile() {
  const queryClient = useQueryClient()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })

  // 수정 전에는 서버 값을 보여준다 (null = 아직 손대지 않음)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [nameErrors, setNameErrors] = useState<FieldErrors>({})
  const [nameNotice, setNameNotice] = useState<string | null>(null)
  const nameMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user) // 헤더 이름 즉시 갱신
      setNameDraft(user.name)
      setNameNotice('저장되었습니다')
    },
    onError: (e) => setNameErrors(toErrors(e, ['name'])),
  })
  const name = nameDraft ?? me?.name ?? ''
  const submitName = (e: FormEvent) => {
    e.preventDefault()
    const error = validateName(name)
    setNameErrors(error ? { name: error } : {})
    setNameNotice(null)
    if (!error) nameMutation.mutate({ name: name.trim() })
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      setAccessToken(data.accessToken) // 이 기기는 새 토큰으로 로그인 유지
      setCurrentPassword('')
      setNewPassword('')
      setPasswordNotice('변경되었습니다. 다른 기기는 로그아웃됩니다')
    },
    onError: (e) => setPasswordErrors(toErrors(e, ['currentPassword', 'newPassword'])),
  })
  const submitPassword = (e: FormEvent) => {
    e.preventDefault()
    const found: FieldErrors = {}
    if (!currentPassword) found.currentPassword = '현재 비밀번호를 입력하세요'
    const pw = validatePassword(newPassword)
    if (pw) found.newPassword = pw
    setPasswordErrors(found)
    setPasswordNotice(null)
    if (Object.keys(found).length === 0) passwordMutation.mutate({ currentPassword, newPassword })
  }

  return {
    email: me?.email ?? '',
    name,
    setName: setNameDraft,
    submitName,
    isSavingName: nameMutation.isPending,
    nameErrors,
    nameNotice,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    submitPassword,
    isChangingPassword: passwordMutation.isPending,
    passwordErrors,
    passwordNotice,
  }
}
