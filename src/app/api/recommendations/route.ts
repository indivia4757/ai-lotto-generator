import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { estimateLatestDrawNo } from "@/lib/dhlottery/client";

const createSchema = z.object({
  recipientId: z.number().nullable().optional(),
  algorithmId: z.number(),
  algorithmSlug: z.string(),
  numbers: z.array(z.number().int().min(1).max(45)).length(6),
  targetDrawNo: z.number().int().optional(),
  memo: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const recipientId = searchParams.get("recipientId");

  const supabase = createServerClient();
  let query = supabase
    .from("recommendations")
    .select("*, recipient:recipients(*), algorithm:algorithms(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (recipientId) {
    query = query.eq("recipient_id", recipientId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendations: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetDrawNo = parsed.data.targetDrawNo || estimateLatestDrawNo() + 1;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      recipient_id: parsed.data.recipientId ?? null,
      algorithm_id: parsed.data.algorithmId,
      algorithm_slug: parsed.data.algorithmSlug,
      numbers: parsed.data.numbers,
      target_draw_no: targetDrawNo,
      memo: parsed.data.memo ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendation: data }, { status: 201 });
}
