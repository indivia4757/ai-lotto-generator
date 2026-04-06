import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const offset = (page - 1) * limit;

  const draws = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC LIMIT ? OFFSET ?")
    .all(limit, offset);
  const { total } = db
    .prepare("SELECT COUNT(*) as total FROM draw_results")
    .get() as { total: number };

  return NextResponse.json({ draws, total, page, limit });
}
