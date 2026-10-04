/** Local calendar day as YYYY-MM-DD (the user's day, not UTC). */
export function toDayString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Combines a YYYY-MM-DD day and an HH:MM time into a local Date. */
export function atTime(day: string, time: string): Date {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, dayOfMonth, hours, minutes, 0, 0);
}

/** Whole days between two YYYY-MM-DD strings (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((atTime(b, '12:00').getTime() - atTime(a, '12:00').getTime()) / 86_400_000);
}
