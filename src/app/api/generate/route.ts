import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAlgorithm, getAllAlgorithms } from "@/lib/algorithms";
import { createServerClient } from "@/lib/supabase/server";

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

  // 최근 당첨 결과 가져오기
  const supabase = createServerClient();
  const { data: history } = await supabase
    .from("draw_results")
    .select("*")
    .order("draw_no", { ascending: false })
    .limit(100);

  const sets = algorithm.generate(history || [], count);

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
