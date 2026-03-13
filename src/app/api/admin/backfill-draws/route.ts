import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchDrawResult, estimateLatestDrawNo } from "@/lib/dhlottery/client";

export async function POST() {
  const supabase = createServerClient();
  const latestEstimate = estimateLatestDrawNo();

  // 이미 저장된 최신 회차 확인
  const { data: existing } = await supabase
    .from("draw_results")
    .select("draw_no")
    .order("draw_no", { ascending: false })
    .limit(1);

  const startFrom = existing && existing.length > 0 ? existing[0].draw_no + 1 : 1;
  let inserted = 0;
  let failed = 0;

  for (let drawNo = startFrom; drawNo <= latestEstimate; drawNo++) {
    const result = await fetchDrawResult(drawNo);
    if (!result) {
      failed++;
      if (failed > 3) break; // 3연속 실패 시 중단
      continue;
    }
    failed = 0;

    const { error } = await supabase.from("draw_results").upsert({
      draw_no: result.drwNo,
      draw_date: result.drwNoDate,
      num1: result.drwtNo1,
      num2: result.drwtNo2,
      num3: result.drwtNo3,
      num4: result.drwtNo4,
      num5: result.drwtNo5,
      num6: result.drwtNo6,
      bonus_num: result.bnusNo,
      total_sales: result.totSellamnt,
      first_prize: result.firstWinamnt,
      first_winners: result.firstPrzwnerCo,
    }, { onConflict: "draw_no" });

    if (!error) inserted++;

    // API 부하 방지
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({
    message: `Backfill 완료: ${inserted}건 저장, 시작회차 ${startFrom}`,
    inserted,
    startFrom,
    latestEstimate,
  });
}
