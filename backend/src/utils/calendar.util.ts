const DAY_MS = 86400000;
const VIETNAM_OFFSET_MS = 7 * 3600000;

// Business calendar: Vietnam (UTC+7); stored timestamps and DB connections use UTC.
export function learningPeriodStarts(now = new Date()) {
  const local = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const monday = today - ((local.getUTCDay() + 6) % 7) * DAY_MS;
  const month = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  return {
    today: new Date(today - VIETNAM_OFFSET_MS),
    week: new Date(monday - VIETNAM_OFFSET_MS),
    month: new Date(month - VIETNAM_OFFSET_MS),
  };
}

/** Đếm chuỗi học hiện tại; học hôm qua vẫn giữ chuỗi để người dùng tiếp tục hôm nay. */
export function learningStreak(dateKeys: string[], now = new Date()) {
  const local = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const days = [...new Set(dateKeys)]
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .map((value) => Date.parse(`${value}T00:00:00Z`))
    .filter((value) => Number.isFinite(value) && value <= today)
    .sort((a, b) => b - a);
  if (!days.length || (today - days[0]) / DAY_MS > 1) {
    return 0;
  }

  let streak = 1;
  while (streak < days.length && days[streak - 1] - days[streak] === DAY_MS) {
    streak++;
  }
  return streak;
}
