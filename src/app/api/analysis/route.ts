import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { DrawResult } from "@/lib/db/types";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "summary";
  const limit = 200;

  const draws = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC LIMIT ?")
    .all(limit) as DrawResult[];

  if (draws.length === 0) {
    return NextResponse.json(
      { error: "분석할 당첨 데이터가 없습니다. 먼저 데이터를 수집하세요." },
      { status: 400 }
    );
  }

  const recent = draws.slice(0, 30);
  const drawSummary = recent
    .map(
      (d) =>
        `${d.draw_no}회(${d.draw_date}): [${getNumbers(d).join(",")}] + 보너스 ${d.bonus_num}`
    )
    .join("\n");

  const freq: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  for (const d of draws) {
    for (const n of getNumbers(d)) freq[n]++;
  }
  const sorted = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .map(([num, count]) => `${num}번(${count}회)`);

  const baseContext = `한국 로또 6/45 당첨 데이터입니다.
총 ${draws.length}회차 데이터 보유.

최근 30회차 당첨번호:
${drawSummary}

전체 ${draws.length}회차 출현 빈도 (상위 10개): ${sorted.slice(0, 10).join(", ")}
전체 ${draws.length}회차 출현 빈도 (하위 10개): ${sorted.slice(-10).join(", ")}`;

  let prompt = "";
  switch (type) {
    case "pattern":
      prompt = `${baseContext}

위 데이터를 기반으로 다음을 분석해주세요:
1. 최근 10회차의 주요 패턴 (홀짝 비율, 고저 비율, 구간 분포)
2. 연번(연속된 번호) 출현 트렌드
3. 특이 패턴이나 주기성
4. 최근 트렌드 요약

한국어로 답변하고, 구체적인 숫자를 포함해 분석해주세요.`;
      break;

    case "recommend":
      prompt = `${baseContext}

위 데이터를 분석하여 다음 회차 번호 5세트를 추천해주세요.
각 세트마다:
1. 6개 번호 (1~45, 오름차순)
2. 선정 근거 (어떤 통계적 요인을 반영했는지)

주의사항:
- 홀짝 비율 2:4~4:2
- 합계 100~200 범위
- 최소 3개 구간 이상 분포
- 동일 끝수 최대 2개

한국어로 답변해주세요. 각 세트를 명확히 구분해주세요.`;
      break;

    default:
      prompt = `${baseContext}

위 데이터를 기반으로 전체적인 통계 요약을 해주세요:
1. 가장 많이/적게 나온 번호 TOP 5
2. 최근 10회차 핫넘버와 콜드넘버
3. 홀짝/고저 비율 트렌드
4. 구간별(1-10, 11-20, 21-30, 31-40, 41-45) 출현 편차
5. 주목할 만한 통계적 특이사항

한국어로, 구체적 수치와 함께 답변해주세요.`;
  }

  return NextResponse.json({
    prompt,
    type,
    analyzedDraws: draws.length,
    instruction:
      "이 프롬프트를 Claude Code 또는 Codex CLI에 붙여넣어 분석하세요.",
  });
}
