import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

// 오류 로깅은 여기로 모은다. 운영 환경에서는 남기지 않는다 (frontend/CLAUDE.md)
export function logError(context: string, err: unknown): void {
  if (import.meta.env?.DEV) console.error(context, err)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e) => logError('query', e) }),
  mutationCache: new MutationCache({ onError: (e) => logError('mutation', e) }),
  defaultOptions: { queries: { retry: false } },
})
