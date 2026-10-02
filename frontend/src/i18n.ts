import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from './locales/ko.ts'
import en, { koToEn } from './locales/en.ts'

// 기본 ko 고정(브라우저 언어 무시). 저장값이 'en' 일 때만 영어 (PRD 7.2 다국어)
function readLang(): 'ko' | 'en' {
  try {
    return globalThis.localStorage?.getItem('lang') === 'en' ? 'en' : 'ko'
  } catch {
    return 'ko'
  }
}

i18n.use(initReactI18next).init({
  resources: { ko: { translation: ko }, en: { translation: en } },
  lng: readLang(),
  fallbackLng: 'ko',
  initAsync: false,
  interpolation: { escapeValue: false }, // React 가 이스케이프한다
})

i18n.on('languageChanged', (lng) => {
  if (globalThis.document) document.documentElement.lang = lng
  try {
    localStorage.setItem('lang', lng)
  } catch {
    // 저장 불가 환경이면 이번 접속에만 적용
  }
})

// 서버·검증 문구(한국어 고정)를 표시 시점에 번역. 대응표에 없으면 원문
export function tr(msg: string, lang: string = i18n.language): string {
  return lang === 'en' ? (koToEn[msg] ?? msg) : msg
}

export default i18n
