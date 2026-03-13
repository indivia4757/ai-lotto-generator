import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import type { DrawResult } from "@/lib/supabase/types";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

function buildAnalysisPrompt(draws: DrawResult[], type: string): string {
  const recent = draws.slice(0, 30);
  const drawSummary = recent
    .map((d) => `${d.draw_no}회(${d.draw_date}): [${getNumbers(d).join(",")}] + 보너스 ${d.bonus_num}`)
    .join("\n");

  // 빈도 계산
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

  switch (type) {
    case "pattern":
      return `${baseContext}

위 데이터를 기반으로 다음을 분석해주세요:
1. 최근 10회차의 주요 패턴 (홀짝 비율, 고저 비율, 구간 분포)
2. 연번(연속된 번호) 출현 트렌드
3. 특이 패턴이나 주기성
4. 최근 트렌드 요약

한국어로 답변하고, 구체적인 숫자를 포함해 분석해주세요.`;

    case "recommend":
      return `${baseContext}

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

    case "summary":
      return `${baseContext}

위 데이터를 기반으로 전체적인 통계 요약을 해주세요:
1. 가장 많이/적게 나온 번호 TOP 5
2. 최근 10회차 핫넘버와 콜드넘버
3. 홀짝/고저 비율 트렌드
4. 구간별(1-10, 11-20, 21-30, 31-40, 41-45) 출현 편차
5. 주목할 만한 통계적 특이사항

한국어로, 구체적 수치와 함께 답변해주세요.`;

    default:
      return `${baseContext}\n\n위 로또 데이터를 종합 분석해주세요. 한국어로 답변해주세요.`;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const type = body.type || "summary"; // pattern, recommend, summary

  const supabase = createServerClient();
  const { data: draws } = await supabase
    .from("draw_results")
    .select("*")
    .order("draw_no", { ascending: false })
    .limit(200);

  if (!draws || draws.length === 0) {
    return NextResponse.json(
      { error: "분석할 당첨 데이터가 없습니다. 먼저 데이터를 수집하세요." },
      { status: 400 }
    );
  }

  const prompt = buildAnalysisPrompt(draws, type);

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 로또 데이터 분석 전문가입니다. 통계적 사실에 기반하여 객관적으로 분석하되, 로또는 확률 게임이라는 점을 항상 명시합니다. 마크다운 형식으로 깔끔하게 답변합니다.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "분석 결과를 생성하지 못했습니다.";
    const usage = completion.usage;

    return NextResponse.json({
      analysis: content,
      type,
      model: "gpt-4o-mini",
      tokens: usage
        ? { prompt: usage.prompt_tokens, completion: usage.completion_tokens, total: usage.total_tokens }
        : null,
      analyzedDraws: draws.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI 분석 중 오류 발생";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
