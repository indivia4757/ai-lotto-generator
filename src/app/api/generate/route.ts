import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAlgorithm, getAllAlgorithms } from "@/lib/algorithms";
import db from "@/lib/db";
import type { DrawResult } from "@/lib/db/types";

const schema = z.object({
  algorithmSlug: z.string(),
  count: z.number().int().min(1).max(10).default(5),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { algorithmSlug, count } = parsed.data;
  const algorithm = getAlgorithm(algorithmSlug);

  if (!algorithm) {
    return NextResponse.json(
      { error: `Unknown algorithm: ${algorithmSlug}` },
      { status: 400 }
    );
  }

  const history = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC LIMIT 100")
    .all() as DrawResult[];

  const sets = algorithm.generate(history, count);

  // Record generation session
  const latestDrawNo = history.length > 0 ? history[0].draw_no + 1 : 1;
  db.prepare(
    "INSERT INTO generation_sessions (target_draw_no, algorithm_slug, total_sets) VALUES (?, ?, ?)"
  ).run(latestDrawNo, algorithmSlug, count);

  return NextResponse.json({
    algorithm: { slug: algorithm.slug, name: algorithm.name },
    sets,
    generatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  const algos = getAllAlgorithms().map((a) => ({
    slug: a.slug,
    name: a.name,
  }));
  return NextResponse.json({ algorithms: algos });
}
