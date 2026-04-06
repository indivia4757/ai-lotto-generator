import { NextResponse } from "next/server";
import db from "@/lib/db";
import { matchRecommendation } from "@/lib/matching/engine";
import type { DrawResult, Recommendation } from "@/lib/db/types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latestDraw = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC LIMIT 1")
    .get() as DrawResult | undefined;

  if (!latestDraw) {
    return NextResponse.json({ message: "추첨 결과 없음" });
  }

  // Get recommendations for this draw
  const rawRecs = db
    .prepare("SELECT * FROM recommendations WHERE target_draw_no = ?")
    .all(latestDraw.draw_no) as (Omit<Recommendation, "numbers"> & { numbers: string })[];

  const recommendations: Recommendation[] = rawRecs.map((r) => ({
    ...r,
    numbers: JSON.parse(r.numbers),
  }));

  if (recommendations.length === 0) {
    return NextResponse.json({ message: "매칭할 추천 없음", drawNo: latestDraw.draw_no });
  }

  // Already matched
  const existingMatches = db
    .prepare("SELECT recommendation_id FROM match_results WHERE draw_no = ?")
    .all(latestDraw.draw_no) as { recommendation_id: number }[];
  const matchedIds = new Set(existingMatches.map((m) => m.recommendation_id));
  const unmatched = recommendations.filter((r) => !matchedIds.has(r.id));

  const insertMatch = db.prepare(
    `INSERT INTO match_results (recommendation_id, draw_no, matched_numbers, matched_bonus, rank)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertWinner = db.prepare(
    `INSERT INTO winners (recipient_id, recommendation_id, match_result_id, draw_no, rank)
     VALUES (?, ?, ?, ?, ?)`
  );

  let matched = 0;
  const doMatch = db.transaction(() => {
    for (const rec of unmatched) {
      const result = matchRecommendation(rec, latestDraw);
      const info = insertMatch.run(
        result.recommendationId,
        result.drawNo,
        JSON.stringify(result.matchedNumbers),
        result.matchedBonus ? 1 : 0,
        result.rank
      );
      matched++;

      // If winning, record in winners table
      if (result.rank !== null) {
        insertWinner.run(
          rec.recipient_id,
          rec.id,
          info.lastInsertRowid,
          result.drawNo,
          result.rank
        );
      }
    }

    // Update winning_history
    const stats = db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN rank = 1 THEN 1 ELSE 0 END) as r1,
          SUM(CASE WHEN rank = 2 THEN 1 ELSE 0 END) as r2,
          SUM(CASE WHEN rank = 3 THEN 1 ELSE 0 END) as r3,
          SUM(CASE WHEN rank = 4 THEN 1 ELSE 0 END) as r4,
          SUM(CASE WHEN rank = 5 THEN 1 ELSE 0 END) as r5,
          SUM(CASE WHEN rank IS NULL THEN 1 ELSE 0 END) as none
        FROM match_results WHERE draw_no = ?`
      )
      .get(latestDraw.draw_no) as Record<string, number>;

    db.prepare(
      `INSERT OR REPLACE INTO winning_history
       (draw_no, total_recommendations, rank1_count, rank2_count, rank3_count, rank4_count, rank5_count, none_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      latestDraw.draw_no, stats.total,
      stats.r1, stats.r2, stats.r3, stats.r4, stats.r5, stats.none
    );
  });

  doMatch();

  return NextResponse.json({
    message: "매칭 완료",
    drawNo: latestDraw.draw_no,
    matched,
    total: unmatched.length,
  });
}
