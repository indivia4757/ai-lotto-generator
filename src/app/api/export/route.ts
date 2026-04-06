import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { DrawResult } from "@/lib/db/types";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const limit = Math.min(Number(searchParams.get("limit") || 200), 2000);

  const draws = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC LIMIT ?")
    .all(limit) as DrawResult[];

  if (format === "csv") {
    const header = "회차,날짜,번호1,번호2,번호3,번호4,번호5,번호6,보너스,총판매액,1등상금,1등당첨자수";
    const rows = draws.map(
      (d) =>
        `${d.draw_no},${d.draw_date},${d.num1},${d.num2},${d.num3},${d.num4},${d.num5},${d.num6},${d.bonus_num},${d.total_sales || 0},${d.first_prize || 0},${d.first_winners || 0}`
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=lotto_draws.csv",
      },
    });
  }

  // JSON with analysis context
  const freq: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  for (const d of draws) {
    for (const n of getNumbers(d)) freq[n]++;
  }

  const sorted = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .map(([num, count]) => ({ number: Number(num), count }));

  const recent30 = draws.slice(0, 30).map((d) => ({
    draw_no: d.draw_no,
    draw_date: d.draw_date,
    numbers: getNumbers(d),
    bonus: d.bonus_num,
  }));

  return NextResponse.json({
    totalDraws: draws.length,
    recent30,
    frequency: {
      top10: sorted.slice(0, 10),
      bottom10: sorted.slice(-10),
    },
    allDraws: draws.map((d) => ({
      draw_no: d.draw_no,
      draw_date: d.draw_date,
      numbers: getNumbers(d),
      bonus: d.bonus_num,
      first_prize: d.first_prize,
      first_winners: d.first_winners,
    })),
  });
}
