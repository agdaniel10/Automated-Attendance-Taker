export function formatTooltipCount(
  value: unknown,
  noun: string,
): [string, string] {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0

  const safeValue = Number.isFinite(numericValue) ? numericValue : 0
  return [`${safeValue} ${noun}`, 'Attendance']
}
