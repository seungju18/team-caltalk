import Button from './Button'
import CalendarCell from './CalendarCell'
import { useCalendarMonth } from '../hooks/useCalendarMonth'
import { useLang } from '../hooks/useLang'

export default function CalendarGrid() {
  const c = useCalendarMonth()
  const { t, te } = useLang()
  return (
    <>
      <div className="flex items-center justify-center gap-4 px-4 py-3 border-b border-line">
        <Button variant="icon" onClick={c.prevMonth} aria-label={t('calendar.prev')}>
          &lt;
        </Button>
        <h2 className="text-xl md:text-2xl font-bold tabular-nums">{c.label}</h2>
        <Button variant="icon" onClick={c.nextMonth} aria-label={t('calendar.next')}>
          &gt;
        </Button>
      </div>
      {c.calendarError && (
        <p role="alert" className="px-4 py-2 text-sm text-danger bg-danger/10 border-b border-line">
          {te(c.calendarError)}
        </p>
      )}
      {c.isCalendarLoading && <p className="px-4 py-2 text-sm text-fg-muted border-b border-line">{t('common.loading')}</p>}
      <div className="grid grid-cols-7 bg-muted-bg border-b border-line text-sm">
        {t('calendar.weekdays').split(' ').map((d, i) => (
          <div key={d} className={`px-3 py-2 ${i === 0 ? 'text-danger' : ''}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {c.cells.map((cell, i) => (
          <CalendarCell key={cell?.date ?? `empty-${i}`} cell={cell} onOpen={c.openEdit} />
        ))}
      </div>
      <p className="md:hidden px-4 py-3 text-xs text-fg-muted">{t('calendar.mobileHint')}</p>
    </>
  )
}
