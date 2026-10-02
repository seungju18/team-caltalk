import { test } from 'node:test'
import assert from 'node:assert/strict'
import { today, addMonths, monthLabel, monthLabelEn, monthGrid, buildCalendarCells } from '../src/lib/date.ts'

// docs/1-domain-definition.md 5.2 예시 데이터 (T = 2026-10-01)
const SEED = [
  { title: 'A', startDate: '2026-09-25', endDate: '2026-09-28' },
  { title: 'B', startDate: '2026-09-30', endDate: '2026-10-02' },
  { title: 'C', startDate: '2026-10-01', endDate: '2026-10-01' },
  { title: 'D', startDate: '2026-10-05', endDate: '2026-10-06' },
  { title: 'E', startDate: '2026-10-05', endDate: '2026-10-06' },
  { title: 'F', startDate: '2026-09-20', endDate: '2026-09-25' },
]
const titles = (cell: any) => cell.todos.map((t: any) => t.title)
const shown = (cells: any[]) => [...new Set(cells.filter(Boolean).flatMap(titles))].sort()

test('today: 로컬 날짜 기준, 0 채움', () => {
  assert.equal(today(new Date(2026, 9, 1, 0, 5)), '2026-10-01')
  assert.equal(today(new Date(2026, 8, 30, 23, 59)), '2026-09-30')
  assert.equal(today(new Date(2026, 0, 5)), '2026-01-05')
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/)
})

test('addMonths: 연도 넘김', () => {
  assert.equal(addMonths('2026-12', 1), '2027-01')
  assert.equal(addMonths('2026-01', -1), '2025-12')
  assert.equal(addMonths('2026-10', 0), '2026-10')
  assert.equal(addMonths('2026-10', -13), '2025-09')
})

test('monthLabel', () => {
  assert.equal(monthLabel('2026-10'), '2026년 10월')
  assert.equal(monthLabel('2026-01'), '2026년 1월')
})

test('monthLabelEn', () => {
  assert.equal(monthLabelEn('2026-10'), 'October 2026')
  assert.equal(monthLabelEn('2026-01'), 'January 2026')
})

test('monthGrid: 2026-10 (목요일 시작, 35칸)', () => {
  const g = monthGrid('2026-10')
  assert.equal(g.length, 35)
  assert.deepEqual(g.slice(0, 4), [null, null, null, null])
  assert.equal(g[4], '2026-10-01')
  assert.equal(g[34], '2026-10-31')
})

test('monthGrid: 2월·윤년·6주', () => {
  const feb = monthGrid('2026-02')
  assert.equal(feb.length, 28)
  assert.equal(feb[0], '2026-02-01')
  assert.equal(feb[27], '2026-02-28')
  const leap = monthGrid('2024-02').filter(Boolean)
  assert.equal(leap.length, 29)
  assert.equal(leap.at(-1), '2024-02-29')
  const aug = monthGrid('2026-08')
  assert.equal(aug.length, 42)
  assert.equal(aug[6], '2026-08-01')
  assert.equal(aug.length % 7, 0)
})

test('buildCalendarCells: AC-09-1 10월은 B, C, D, E', () => {
  const cells = buildCalendarCells('2026-10', SEED, '2026-10-01')
  assert.equal(cells.length, 35)
  assert.deepEqual(cells.slice(0, 4), [null, null, null, null])
  assert.deepEqual(shown(cells), ['B', 'C', 'D', 'E'])

  const c1 = cells[4]!
  assert.equal(c1.date, '2026-10-01')
  assert.equal(c1.day, 1)
  assert.equal(c1.isToday, true)
  assert.equal(c1.isSunday, false)
  assert.deepEqual(titles(c1), ['B', 'C'])
  assert.equal(c1.count, 2)
  assert.equal(c1.more, 0)

  assert.deepEqual(titles(cells[5]), ['B'])
  assert.equal(cells[5]!.isToday, false)
  assert.equal(cells[7]!.date, '2026-10-04')
  assert.equal(cells[7]!.isSunday, true)
  assert.deepEqual(titles(cells[7]), [])
  assert.deepEqual(titles(cells[8]), ['D', 'E'])
})

test('buildCalendarCells: AC-09-2 9월은 A, B, F', () => {
  const cells = buildCalendarCells('2026-09', SEED, '2026-10-01')
  assert.deepEqual(shown(cells), ['A', 'B', 'F'])
  assert.equal(cells.some((c) => c?.isToday), false)
})

test('buildCalendarCells: 하루 5건이면 3건 + more 2, max 인자', () => {
  const five = ['1', '2', '3', '4', '5'].map((title) => ({ title, startDate: '2026-10-10', endDate: '2026-10-10' }))
  const cell = buildCalendarCells('2026-10', five, '2026-10-01')[13]!
  assert.equal(cell.date, '2026-10-10')
  assert.deepEqual(titles(cell), ['1', '2', '3'])
  assert.equal(cell.count, 5)
  assert.equal(cell.more, 2)

  const one = buildCalendarCells('2026-10', five, '2026-10-01', 1)[13]!
  assert.deepEqual(titles(one), ['1'])
  assert.equal(one.more, 4)
  assert.equal(one.count, 5)
})
