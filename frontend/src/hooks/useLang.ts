import { useTranslation } from 'react-i18next'
import { tr } from '../i18n'

// 화면 문구(t)·오류 문구 번역(te)·언어 전환. 언어 상태는 i18next 가 들고 있다
export function useLang() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  return {
    t,
    lang,
    te: (msg: string) => tr(msg, lang),
    toggleLang: () => i18n.changeLanguage(lang === 'en' ? 'ko' : 'en'),
  }
}
