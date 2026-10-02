import { AxiosError } from 'axios'

// localStorage(Map 기반)·document.documentElement.classList 스텁. 기록을 반환한다.
export function stubBrowser(theme: string | null = null) {
  const store = new Map<string, string>()
  if (theme !== null) store.set('theme', theme)
  const toggles: [string, boolean | undefined][] = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    },
  })
  ;(globalThis as any).document = {
    documentElement: { classList: { toggle: (c: string, force?: boolean) => (toggles.push([c, force]), !!force) } },
  }
  return { store, toggles }
}

export type Req = { method: string; url: string; params: any; data: any; auth: string | undefined }
type Reply = [number, unknown] | 'network'

// api.defaults.adapter 를 모의로 교체. 요청 기록 배열을 반환한다.
export function mockAdapter(api: any, handler: (req: Req) => Reply | Promise<Reply>) {
  const calls: Req[] = []
  api.defaults.adapter = async (config: any) => {
    const req: Req = {
      method: config.method,
      url: config.url,
      params: config.params,
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      auth: config.headers?.Authorization,
    }
    calls.push(req)
    const reply = await handler(req)
    if (reply === 'network') throw new AxiosError('net', 'ERR_NETWORK', config)
    const [status, data] = reply
    const res = { data, status, statusText: '', headers: {}, config }
    if (status >= 200 && status < 300) return res
    throw new AxiosError('x', 'ERR_BAD_REQUEST', config, null, res as any)
  }
  return calls
}
