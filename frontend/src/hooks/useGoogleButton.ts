import { useEffect, useRef } from 'react'
import { useUiStore } from '../stores/uiStore'
import { useLang } from './useLang'

// GIS(index.html 의 gsi/client 스크립트)에서 쓰는 만큼만 선언
type Gis = {
  initialize(o: { client_id: string; callback: (r: { credential: string }) => void }): void
  renderButton(el: HTMLElement, o: { theme: string; locale: string; width?: number }): void
}
declare global {
  interface Window {
    google?: { accounts: { id: Gis } }
  }
}

const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

// ref 의 div 에 Google 버튼을 그린다. 테마·언어가 바뀌면 다시 그린다. client ID 가 없으면 아무것도 안 한다
export function useGoogleButton(onCredential: (credential: string) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const theme = useUiStore((s) => s.theme)
  const { lang } = useLang()
  // onCredential 은 매 렌더 새로 만들어지지만 안에서 쓰는 mutate 는 안정적이라 deps 에서 뺀다
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const draw = () => {
      const gis = window.google?.accounts.id
      if (!gis || !ref.current) return
      gis.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onCredential(r.credential) })
      gis.renderButton(ref.current, {
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        locale: lang === 'en' ? 'en' : 'ko',
        width: ref.current.offsetWidth,
      })
    }
    if (window.google) return draw()
    // 스크립트(async)가 아직 안 받아졌으면 load 를 기다린다
    const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    script?.addEventListener('load', draw)
    return () => script?.removeEventListener('load', draw)
  }, [theme, lang])
  return { googleRef: ref, hasGoogle: GOOGLE_CLIENT_ID !== '' }
}
