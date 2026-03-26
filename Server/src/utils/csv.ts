function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvValue).join(","));

  for (const row of rows) {
    const mapped = row.map((cell) => {
      if (cell === null || cell === undefined) {
        return escapeCsvValue("");
      }
      return escapeCsvValue(String(cell));
    });
    lines.push(mapped.join(","));
  }

  return `${lines.join("\n")}\n`;
}
