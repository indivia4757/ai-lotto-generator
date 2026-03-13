import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { matchRecommendation } from "@/lib/matching/engine";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // 최신 추첨 결과
  const { data: latestDraw } = await supabase
    .from("draw_results")
    .select("*")
    .order("draw_no", { ascending: false })
    .limit(1)
    .single();

  if (!latestDraw) {
    return NextResponse.json({ message: "추첨 결과 없음" });
  }

  // 해당 회차 대상 추천 중 아직 매칭 안 된 것
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*")
    .eq("target_draw_no", latestDraw.draw_no);

  if (!recommendations || recommendations.length === 0) {
    return NextResponse.json({ message: "매칭할 추천 없음", drawNo: latestDraw.draw_no });
  }

  // 이미 매칭된 추천 ID
  const { data: existingMatches } = await supabase
    .from("match_results")
    .select("recommendation_id")
    .eq("draw_no", latestDraw.draw_no);

  const matchedIds = new Set((existingMatches || []).map((m) => m.recommendation_id));
  const unmatched = recommendations.filter((r) => !matchedIds.has(r.id));

  let matched = 0;
  for (const rec of unmatched) {
    const result = matchRecommendation(rec, latestDraw);
    const { error } = await supabase.from("match_results").insert({
      recommendation_id: result.recommendationId,
      draw_no: result.drawNo,
      matched_numbers: result.matchedNumbers,
      matched_bonus: result.matchedBonus,
      rank: result.rank,
    });
    if (!error) matched++;
  }

  return NextResponse.json({
    message: `매칭 완료`,
    drawNo: latestDraw.draw_no,
    matched,
    total: unmatched.length,
  });
}
