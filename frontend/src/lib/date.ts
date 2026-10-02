const pad = (n: number) => String(n).padStart(2, '0')

// 로컬 시간대 기준 오늘 (OI-05). toISOString 은 UTC 라 쓰지 않는다
export function today(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${y}년 ${m}월`
}

// 영어 월 표시 ("October 2026")
export function monthLabelEn(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(new Date(y, m - 1, 1))
}

// 일요일 시작 격자. 앞뒤 빈칸은 null, 마지막 주까지만
export function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1).getDay()
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = Array(first).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${month}-${pad(d)}`)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export type CalendarCell<T> = {
  date: string
  day: number
  isToday: boolean
  isSunday: boolean
  todos: T[]
  more: number
  count: number
} | null

export function buildCalendarCells<T extends { startDate: string; endDate: string }>(
  month: string,
  todos: T[],
  todayDate: string,
  max = 3,
): CalendarCell<T>[] {
  return monthGrid(month).map((date, i) => {
    if (date === null) return null
    const all = todos.filter((t) => t.startDate <= date && date <= t.endDate)
    const shown = all.slice(0, max)
    return {
      date,
      day: Number(date.slice(8)),
      isToday: date === todayDate,
      isSunday: i % 7 === 0,
      todos: shown,
      more: all.length - shown.length,
      count: all.length,
    }
  })
}
