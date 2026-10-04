export type GreetingKey = 'today.goodMorning' | 'today.goodAfternoon' | 'today.goodEvening';

export function greetingKey(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return 'today.goodMorning';
  if (hour >= 12 && hour < 19) return 'today.goodAfternoon';
  return 'today.goodEvening';
}
