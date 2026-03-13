export interface DhLotteryResult {
  returnValue: string;
  drwNo: number;
  drwNoDate: string;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
  totSellamnt: number;
  firstWinamnt: number;
  firstPrzwnerCo: number;
}

const DHLOTTERY_URL = "https://www.dhlottery.co.kr/common.do";

export async function fetchDrawResult(drawNo: number): Promise<DhLotteryResult | null> {
  // 1차: 동행복권 직접 API
  const result = await tryFetch(
    `${DHLOTTERY_URL}?method=getLottoNumber&drwNo=${drawNo}`
  );
  if (result) return result;

  // 2차: 동행복권 (User-Agent 추가)
  const result2 = await tryFetch(
    `${DHLOTTERY_URL}?method=getLottoNumber&drwNo=${drawNo}`,
    { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  );
  if (result2) return result2;

  return null;
}

async function tryFetch(
  url: string,
  headers?: Record<string, string>
): Promise<DhLotteryResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: headers || {},
      cache: "no-store",
    });
    clearTimeout(timeout);

    const data: DhLotteryResult = await res.json();
    if (data.returnValue !== "success") return null;
    return data;
  } catch {
    return null;
  }
}

/** 현재 최신 회차 추정 (2002-12-07 1회차 기준, 매주 토요일 추첨) */
export function estimateLatestDrawNo(): number {
  const firstDraw = new Date("2002-12-07");
  const now = new Date();
  const diffWeeks = Math.floor(
    (now.getTime() - firstDraw.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return diffWeeks + 1;
}
