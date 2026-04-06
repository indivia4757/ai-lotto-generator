import { NextResponse } from "next/server";
import db from "@/lib/db";

const CSV_URL =
  "https://raw.githubusercontent.com/godmode2k/lotto645/main/lotto645_%EB%8B%B9%EC%B2%A8%EB%B2%88%ED%98%B81205%ED%9A%8C%EC%B0%A8%EA%B9%8C%EC%A7%80.csv";

function calcDrawDate(drawNo: number): string {
  const first = new Date("2002-12-07");
  const date = new Date(first.getTime() + (drawNo - 1) * 7 * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

function parsePrize(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function parseWinners(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function POST() {
  let csvText: string;
  try {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    csvText = await res.text();
  } catch {
    return NextResponse.json({ error: "CSV 다운로드 실패" }, { status: 500 });
  }

  const lines = csvText.split("\n").filter((l) => l.trim());
  const dataLines = lines.slice(1);

  interface DrawRow {
    draw_no: number;
    draw_date: string;
    num1: number; num2: number; num3: number;
    num4: number; num5: number; num6: number;
    bonus_num: number;
    first_prize: number;
    first_winners: number;
    total_sales: number;
  }

  const rows: DrawRow[] = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    if (fields.length < 10) continue;

    const drawNo = parseInt(fields[1].replace(/,/g, ""), 10);
    if (isNaN(drawNo) || drawNo < 1) continue;

    const nums = fields.slice(2, 8).map((n) => parseInt(n, 10));
    const bonus = parseInt(fields[8], 10);
    if (nums.some(isNaN) || isNaN(bonus)) continue;

    rows.push({
      draw_no: drawNo,
      draw_date: calcDrawDate(drawNo),
      num1: nums[0], num2: nums[1], num3: nums[2],
      num4: nums[3], num5: nums[4], num6: nums[5],
      bonus_num: bonus,
      first_winners: fields.length > 10 ? parseWinners(fields[10]) : 0,
      first_prize: fields.length > 11 ? parsePrize(fields[11]) : 0,
      total_sales: 0,
    });
  }

  const insert = db.prepare(
    `INSERT OR REPLACE INTO draw_results
     (draw_no, draw_date, num1, num2, num3, num4, num5, num6, bonus_num, total_sales, first_prize, first_winners)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batchInsert = db.transaction((items: DrawRow[]) => {
    for (const row of items) {
      insert.run(
        row.draw_no, row.draw_date,
        row.num1, row.num2, row.num3, row.num4, row.num5, row.num6,
        row.bonus_num, row.total_sales, row.first_prize, row.first_winners
      );
    }
  });

  batchInsert(rows);

  return NextResponse.json({
    message: `실제 데이터 ${rows.length}건 삽입 완료`,
    inserted: rows.length,
    parsed: rows.length,
  });
}
