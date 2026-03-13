import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchDrawResult, estimateLatestDrawNo } from "@/lib/dhlottery/client";

export async function GET(request: Request) {
  // Vercel Cron 인증 (선택적)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const latestEstimate = estimateLatestDrawNo();

  const result = await fetchDrawResult(latestEstimate);
  if (!result) {
    return NextResponse.json({ message: "아직 결과 없음", drawNo: latestEstimate });
  }

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "수집 완료", drawNo: result.drwNo });
}
