export function normalizeTaskTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const match = /^(\d{1,2}):([0-5]\d)$/.exec(trimmed);
  const hour = match?.[1];
  const minute = match?.[2];
  if (!hour || !minute || Number(hour) > 23) return null;

  return `${hour.padStart(2, '0')}:${minute}`;
}
