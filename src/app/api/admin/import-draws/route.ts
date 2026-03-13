import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const CSV_URL =
  "https://raw.githubusercontent.com/godmode2k/lotto645/main/lotto645_%EB%8B%B9%EC%B2%A8%EB%B2%88%ED%98%B81205%ED%9A%8C%EC%B0%A8%EA%B9%8C%EC%A7%80.csv";

// 1회차 날짜 기준으로 회차별 날짜 계산
function calcDrawDate(drawNo: number): string {
  const first = new Date("2002-12-07");
  const date = new Date(first.getTime() + (drawNo - 1) * 7 * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

function parsePrize(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function parseWinners(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export async function POST() {
  // CSV 다운로드
  let csvText: string;
  try {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    csvText = await res.text();
  } catch {
    return NextResponse.json({ error: "CSV 다운로드 실패" }, { status: 500 });
  }

  const lines = csvText.split("\n").filter((l) => l.trim());
  // 헤더 스킵
  const dataLines = lines.slice(1);

  // CSV 파싱 (쉼표가 포함된 필드는 따옴표로 감싸져 있음)
  function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const rows: {
    draw_no: number;
    draw_date: string;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
    bonus_num: number;
    first_prize: number;
    first_winners: number;
    total_sales: number;
  }[] = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    if (fields.length < 10) continue;

    // fields: [No, 회차, num1, num2, num3, num4, num5, num6, bonus, 순위, 당첨게임수, 1게임당당첨금액]
    const drawNo = parseInt(fields[1].replace(/,/g, ""), 10);
    if (isNaN(drawNo) || drawNo < 1) continue;

    const nums = fields.slice(2, 8).map((n) => parseInt(n, 10));
    const bonus = parseInt(fields[8], 10);

    if (nums.some(isNaN) || isNaN(bonus)) continue;

    rows.push({
      draw_no: drawNo,
      draw_date: calcDrawDate(drawNo),
      num1: nums[0],
      num2: nums[1],
      num3: nums[2],
      num4: nums[3],
      num5: nums[4],
      num6: nums[5],
      bonus_num: bonus,
      first_winners: fields.length > 10 ? parseWinners(fields[10]) : 0,
      first_prize: fields.length > 11 ? parsePrize(fields[11]) : 0,
      total_sales: 0,
    });
  }

  // 배치 삽입 (50개씩)
  const supabase = createServerClient();
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("draw_results")
      .upsert(batch, { onConflict: "draw_no" });
    if (error) {
      errors++;
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({
    message: `실제 데이터 ${inserted}건 삽입 완료 (총 ${rows.length}건 파싱, ${errors}건 오류)`,
    inserted,
    parsed: rows.length,
    errors,
  });
}
