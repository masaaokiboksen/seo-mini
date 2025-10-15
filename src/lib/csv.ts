// src/lib/csv.ts
export type Row = {
  keyword: string;
  trendScore: number;
  estimatedMonthlySearches: number;
  domain: string;
  source?: string;
};

export function downloadCSV(filename: string, rows: Row[]) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent =
    headers.join(",") +
    "\n" +
    rows
      .map((row) => headers.map((h) => JSON.stringify((row as any)[h] ?? "")).join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
