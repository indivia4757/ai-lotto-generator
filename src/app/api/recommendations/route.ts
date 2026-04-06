import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { estimateLatestDrawNo } from "@/lib/dhlottery/client";

const createSchema = z.object({
  recipientId: z.number().nullable().optional(),
  algorithmId: z.number(),
  algorithmSlug: z.string(),
  numbers: z.array(z.number().int().min(1).max(45)).length(6),
  targetDrawNo: z.number().int().optional(),
  memo: z.string().nullable().optional(),
});

interface RecommendationRow {
  id: number;
  recipient_id: number | null;
  algorithm_id: number;
  algorithm_slug: string;
  numbers: string;
  target_draw_no: number;
  memo: string | null;
  created_at: string;
  recipient_name: string | null;
  recipient_nickname: string | null;
  recipient_contact: string | null;
  recipient_memo: string | null;
  recipient_created_at: string | null;
  algo_name: string | null;
  algo_description: string | null;
  algo_category: string | null;
}

function mapRow(row: RecommendationRow) {
  return {
    id: row.id,
    recipient_id: row.recipient_id,
    algorithm_id: row.algorithm_id,
    algorithm_slug: row.algorithm_slug,
    numbers: JSON.parse(row.numbers),
    target_draw_no: row.target_draw_no,
    memo: row.memo,
    created_at: row.created_at,
    recipient: row.recipient_name
      ? {
          id: row.recipient_id,
          name: row.recipient_name,
          nickname: row.recipient_nickname,
          contact: row.recipient_contact,
          memo: row.recipient_memo,
          created_at: row.recipient_created_at,
        }
      : null,
    algorithm: row.algo_name
      ? {
          id: row.algorithm_id,
          slug: row.algorithm_slug,
          name: row.algo_name,
          description: row.algo_description,
          category: row.algo_category,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const recipientId = searchParams.get("recipientId");

  let sql = `
    SELECT r.*,
      rec.name as recipient_name, rec.nickname as recipient_nickname,
      rec.contact as recipient_contact, rec.memo as recipient_memo,
      rec.created_at as recipient_created_at,
      a.name as algo_name, a.description as algo_description, a.category as algo_category
    FROM recommendations r
    LEFT JOIN recipients rec ON r.recipient_id = rec.id
    LEFT JOIN algorithms a ON r.algorithm_id = a.id
  `;
  const params: (string | number)[] = [];

  if (recipientId) {
    sql += " WHERE r.recipient_id = ?";
    params.push(recipientId);
  }

  sql += " ORDER BY r.created_at DESC LIMIT ?";
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as RecommendationRow[];
  return NextResponse.json({ recommendations: rows.map(mapRow) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetDrawNo = parsed.data.targetDrawNo || estimateLatestDrawNo() + 1;

  const result = db
    .prepare(
      `INSERT INTO recommendations (recipient_id, algorithm_id, algorithm_slug, numbers, target_draw_no, memo)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      parsed.data.recipientId ?? null,
      parsed.data.algorithmId,
      parsed.data.algorithmSlug,
      JSON.stringify(parsed.data.numbers),
      targetDrawNo,
      parsed.data.memo ?? null
    );

  const row = db
    .prepare("SELECT * FROM recommendations WHERE id = ?")
    .get(result.lastInsertRowid) as { numbers: string; matched_bonus?: number } & Record<string, unknown>;

  return NextResponse.json(
    {
      recommendation: {
        ...row,
        numbers: JSON.parse(row.numbers),
      },
    },
    { status: 201 }
  );
}
