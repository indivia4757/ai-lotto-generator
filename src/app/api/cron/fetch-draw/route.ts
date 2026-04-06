import { NextResponse } from "next/server";
import db from "@/lib/db";
import { fetchDrawResult, estimateLatestDrawNo } from "@/lib/dhlottery/client";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latestEstimate = estimateLatestDrawNo();
  const result = await fetchDrawResult(latestEstimate);
  if (!result) {
    return NextResponse.json({ message: "아직 결과 없음", drawNo: latestEstimate });
  }

  db.prepare(
    `INSERT OR REPLACE INTO draw_results
     (draw_no, draw_date, num1, num2, num3, num4, num5, num6, bonus_num, total_sales, first_prize, first_winners)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    result.drwNo, result.drwNoDate,
    result.drwtNo1, result.drwtNo2, result.drwtNo3,
    result.drwtNo4, result.drwtNo5, result.drwtNo6,
    result.bnusNo, result.totSellamnt, result.firstWinamnt, result.firstPrzwnerCo
  );

  return NextResponse.json({ message: "수집 완료", drawNo: result.drwNo });
}
