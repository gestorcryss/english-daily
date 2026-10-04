import { greetingKey } from '@/features/today/greeting';

describe('greetingKey', () => {
  test.each([
    [5, 'today.goodMorning'],
    [11, 'today.goodMorning'],
    [12, 'today.goodAfternoon'],
    [18, 'today.goodAfternoon'],
    [19, 'today.goodEvening'],
    [0, 'today.goodEvening'],
    [4, 'today.goodEvening'],
  ])('hour %i → %s', (hour, expected) => {
    expect(greetingKey(hour)).toBe(expected);
  });
});
