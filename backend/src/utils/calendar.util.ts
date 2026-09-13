// Business calendar: Vietnam (UTC+7); stored timestamps and DB connections use UTC.
export function learningPeriodStarts(now = new Date()) {
  const offset = 7 * 3600000;
  const local = new Date(now.getTime() + offset);
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const monday = today - ((local.getUTCDay() + 6) % 7) * 86400000;
  const month = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  return {
    today: new Date(today - offset),
    week: new Date(monday - offset),
    month: new Date(month - offset),
  };
}
