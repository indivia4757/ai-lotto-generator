import { NextResponse } from "next/server";
import db from "@/lib/db";
import { fetchDrawResult, estimateLatestDrawNo } from "@/lib/dhlottery/client";

export async function POST() {
  const latestEstimate = estimateLatestDrawNo();

  const existing = db
    .prepare("SELECT draw_no FROM draw_results ORDER BY draw_no DESC LIMIT 1")
    .get() as { draw_no: number } | undefined;

  const startFrom = existing ? existing.draw_no + 1 : 1;
  let inserted = 0;
  let failed = 0;

  const insert = db.prepare(
    `INSERT OR REPLACE INTO draw_results
     (draw_no, draw_date, num1, num2, num3, num4, num5, num6, bonus_num, total_sales, first_prize, first_winners)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (let drawNo = startFrom; drawNo <= latestEstimate; drawNo++) {
    const result = await fetchDrawResult(drawNo);
    if (!result) {
      failed++;
      if (failed > 3) break;
      continue;
    }
    failed = 0;

    insert.run(
      result.drwNo, result.drwNoDate,
      result.drwtNo1, result.drwtNo2, result.drwtNo3,
      result.drwtNo4, result.drwtNo5, result.drwtNo6,
      result.bnusNo, result.totSellamnt, result.firstWinamnt, result.firstPrzwnerCo
    );
    inserted++;

    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({
    message: `Backfill 완료: ${inserted}건 저장, 시작회차 ${startFrom}`,
    inserted,
    startFrom,
    latestEstimate,
  });
}
