import type { Habit } from '../types'

/** Dias da semana em que o hábito deve ser feito. Vazio/undefined = todo dia. */
export function habitWeekdays(habit: Pick<Habit, 'weekdays'>): number[] {
  return habit.weekdays && habit.weekdays.length ? habit.weekdays : [0, 1, 2, 3, 4, 5, 6]
}

export function isHabitDue(habit: Pick<Habit, 'weekdays'>, dateISO: string): boolean {
  const dow = new Date(dateISO + 'T12:00:00').getDay()
  return habitWeekdays(habit).includes(dow)
}

/** Streak = dias permitidos consecutivos com conclusão, contando de hoje para trás. */
export function computeStreak(habit: Pick<Habit, 'weekdays' | 'completedDates'>): number {
  const weekdays = habitWeekdays(habit)
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 400; i++) {
    const dow = d.getDay()
    const iso = d.toISOString().slice(0, 10)
    if (weekdays.includes(dow)) {
      if (habit.completedDates.includes(iso)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
