import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(1).max(50),
  nickname: z.string().max(50).nullable().optional(),
  contact: z.string().max(100).nullable().optional(),
  memo: z.string().nullable().optional(),
});

export async function GET() {
  const recipients = db
    .prepare("SELECT * FROM recipients ORDER BY created_at DESC")
    .all();

  return NextResponse.json({ recipients });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, nickname, contact, memo } = parsed.data;
  const result = db
    .prepare(
      "INSERT INTO recipients (name, nickname, contact, memo) VALUES (?, ?, ?, ?)"
    )
    .run(name, nickname ?? null, contact ?? null, memo ?? null);

  const recipient = db
    .prepare("SELECT * FROM recipients WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json({ recipient }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  db.prepare("DELETE FROM recipients WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
