export function formatTaskDueDate(
  date: string,
  language: string,
  labels: { today: string; tomorrow: string },
  today = new Date(),
): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));

  if (year === today.getFullYear()
    && month === today.getMonth() + 1
    && day === today.getDate()) return labels.today;

  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (year === tomorrow.getFullYear()
    && month === tomorrow.getMonth() + 1
    && day === tomorrow.getDate()) return labels.tomorrow;

  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    ...(year === today.getFullYear() ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
