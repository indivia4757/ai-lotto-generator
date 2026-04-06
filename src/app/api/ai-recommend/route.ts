import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { DrawResult } from "@/lib/db/types";
import { type Locale, locales } from "@/lib/i18n/translations";

const apiTexts: Record<Locale, {
  analysisTemplate: string;
  sumLabel: string;
  oddEvenLabel: string;
  acLabel: string;
  consecutive: string;
  avgScoreLabel: string;
  noData: string;
  drawsLabel: string;
  topScoreLabel: string;
  absentLabel: string;
  avgSumLabel: string;
  consecutiveRateLabel: string;
  ensembleLabel: string;
}> = {
  ko: {
    analysisTemplate: "전체 {total}회차 데이터 종합 분석 (시간 가중 적용). 종합 스코어 TOP 5: [{top5}], 장기 미출현: [{neglected}], 전체 합계 평균: {avgSum}, 연번 출현율: {consRate}%. 빈도(20%)+트렌드(20%)+소외회귀(15%)+동반출현(15%)+끝수(10%)+구간균형(10%)+주기성(10%) 7관점 앙상블.",
    sumLabel: "합계", oddEvenLabel: "홀짝", acLabel: "AC값", consecutive: "연번 포함",
    avgScoreLabel: "평균 스코어", noData: "당첨 데이터가 없습니다. 먼저 당첨 결과 페이지에서 데이터를 가져와 주세요.",
    drawsLabel: "회", topScoreLabel: "종합 스코어 TOP 5", absentLabel: "회 미출현",
    avgSumLabel: "전체 합계 평균", consecutiveRateLabel: "연번 출현율", ensembleLabel: "7관점 앙상블",
  },
  en: {
    analysisTemplate: "Comprehensive analysis of {total} draws (time-weighted). Top 5 scores: [{top5}], Long absent: [{neglected}], Average sum: {avgSum}, Consecutive rate: {consRate}%. Frequency(20%)+Trend(20%)+Regression(15%)+Co-occurrence(15%)+Ending(10%)+Section(10%)+Periodicity(10%) 7-factor ensemble.",
    sumLabel: "Sum", oddEvenLabel: "Odd/Even", acLabel: "AC", consecutive: "consecutive included",
    avgScoreLabel: "avg score", noData: "No draw data available. Please import data from the Results page first.",
    drawsLabel: " draws", topScoreLabel: "Top 5 scores", absentLabel: " draws absent",
    avgSumLabel: "Average sum", consecutiveRateLabel: "Consecutive rate", ensembleLabel: "7-factor ensemble",
  },
  zh: {
    analysisTemplate: "综合分析{total}期数据（时间加权）。综合得分TOP 5: [{top5}], 长期未出: [{neglected}], 平均合计: {avgSum}, 连号出现率: {consRate}%。频率(20%)+趋势(20%)+回归(15%)+共现(15%)+尾数(10%)+区间(10%)+周期(10%) 7维集成。",
    sumLabel: "合计", oddEvenLabel: "奇偶", acLabel: "AC值", consecutive: "含连号",
    avgScoreLabel: "平均得分", noData: "暂无开奖数据。请先在结果页面导入数据。",
    drawsLabel: "期", topScoreLabel: "综合得分TOP 5", absentLabel: "期未出",
    avgSumLabel: "平均合计", consecutiveRateLabel: "连号出现率", ensembleLabel: "7维集成",
  },
  ja: {
    analysisTemplate: "全{total}回データ総合分析（時間加重適用）。総合スコアTOP 5: [{top5}], 長期未出現: [{neglected}], 合計平均: {avgSum}, 連番出現率: {consRate}%。頻度(20%)+トレンド(20%)+回帰(15%)+共出現(15%)+末尾(10%)+区間(10%)+周期(10%) 7観点アンサンブル。",
    sumLabel: "合計", oddEvenLabel: "奇偶", acLabel: "AC値", consecutive: "連番含む",
    avgScoreLabel: "平均スコア", noData: "当選データがありません。まず結果ページからデータを取得してください。",
    drawsLabel: "回", topScoreLabel: "総合スコアTOP 5", absentLabel: "回未出現",
    avgSumLabel: "合計平均", consecutiveRateLabel: "連番出現率", ensembleLabel: "7観点アンサンブル",
  },
  es: {
    analysisTemplate: "Análisis integral de {total} sorteos (ponderación temporal). Top 5 puntuaciones: [{top5}], Ausentes largo plazo: [{neglected}], Suma promedio: {avgSum}, Tasa consecutiva: {consRate}%. Frecuencia(20%)+Tendencia(20%)+Regresión(15%)+Co-ocurrencia(15%)+Terminación(10%)+Sección(10%)+Periodicidad(10%) ensemble 7 factores.",
    sumLabel: "Suma", oddEvenLabel: "Par/Impar", acLabel: "AC", consecutive: "consecutivos incluidos",
    avgScoreLabel: "puntuación media", noData: "No hay datos. Importe datos desde la página de resultados.",
    drawsLabel: " sorteos", topScoreLabel: "Top 5 puntuaciones", absentLabel: " sorteos ausente",
    avgSumLabel: "Suma promedio", consecutiveRateLabel: "Tasa consecutiva", ensembleLabel: "ensemble 7 factores",
  },
  fr: {
    analysisTemplate: "Analyse complète de {total} tirages (pondération temporelle). Top 5 scores: [{top5}], Absents longue durée: [{neglected}], Somme moyenne: {avgSum}, Taux consécutif: {consRate}%. Fréquence(20%)+Tendance(20%)+Régression(15%)+Co-occurrence(15%)+Terminaison(10%)+Section(10%)+Périodicité(10%) ensemble 7 facteurs.",
    sumLabel: "Somme", oddEvenLabel: "Pair/Impair", acLabel: "AC", consecutive: "consécutifs inclus",
    avgScoreLabel: "score moyen", noData: "Aucune donnée. Importez les données depuis la page des résultats.",
    drawsLabel: " tirages", topScoreLabel: "Top 5 scores", absentLabel: " tirages absent",
    avgSumLabel: "Somme moyenne", consecutiveRateLabel: "Taux consécutif", ensembleLabel: "ensemble 7 facteurs",
  },
  th: {
    analysisTemplate: "วิเคราะห์ข้อมูล {total} งวด (ถ่วงน้ำหนักเวลา) คะแนนรวม TOP 5: [{top5}], ไม่ออกนาน: [{neglected}], ผลรวมเฉลี่ย: {avgSum}, อัตราเลขต่อเนื่อง: {consRate}% ความถี่(20%)+แนวโน้ม(20%)+การกลับมา(15%)+คู่เลข(15%)+เลขท้าย(10%)+ช่วง(10%)+รอบ(10%) วิเคราะห์ 7 มิติ",
    sumLabel: "ผลรวม", oddEvenLabel: "คี่/คู่", acLabel: "AC", consecutive: "มีเลขต่อเนื่อง",
    avgScoreLabel: "คะแนนเฉลี่ย", noData: "ยังไม่มีข้อมูล กรุณานำเข้าข้อมูลจากหน้าผลรางวัลก่อน",
    drawsLabel: " งวด", topScoreLabel: "คะแนนรวม TOP 5", absentLabel: " งวดไม่ออก",
    avgSumLabel: "ผลรวมเฉลี่ย", consecutiveRateLabel: "อัตราเลขต่อเนื่อง", ensembleLabel: "วิเคราะห์ 7 มิติ",
  },
  vi: {
    analysisTemplate: "Phân tích tổng hợp {total} kỳ (có trọng số thời gian). Điểm tổng hợp TOP 5: [{top5}], Vắng mặt lâu: [{neglected}], Tổng trung bình: {avgSum}, Tỷ lệ liên tiếp: {consRate}%. Tần suất(20%)+Xu hướng(20%)+Hồi quy(15%)+Đồng xuất hiện(15%)+Đuôi số(10%)+Khu vực(10%)+Chu kỳ(10%) tổng hợp 7 yếu tố.",
    sumLabel: "Tổng", oddEvenLabel: "Lẻ/Chẵn", acLabel: "AC", consecutive: "có số liên tiếp",
    avgScoreLabel: "điểm TB", noData: "Chưa có dữ liệu. Vui lòng nhập dữ liệu từ trang kết quả.",
    drawsLabel: " kỳ", topScoreLabel: "Điểm tổng hợp TOP 5", absentLabel: " kỳ vắng",
    avgSumLabel: "Tổng trung bình", consecutiveRateLabel: "Tỷ lệ liên tiếp", ensembleLabel: "tổng hợp 7 yếu tố",
  },
};

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

/** AC값 (Arithmetic Complexity) */
function calcAC(nums: number[]): number {
  const diffs = new Set<number>();
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      diffs.add(Math.abs(nums[i] - nums[j]));
    }
  }
  return diffs.size - (nums.length - 1);
}

/**
 * 전체 회차 종합 스코어 계산
 * 7가지 분석 관점을 모든 데이터에 대해 수행
 */
function buildScores(draws: DrawResult[], locale: Locale = "ko"): {
  scores: number[];
  analysis: string;
  details: {
    freqTop: { num: number; count: number }[];
    recentHot: { num: number; count: number }[];
    neglected: { num: number; gap: number }[];
    topPairs: { pair: string; count: number }[];
    avgSum: number;
    consecutiveRate: number;
  };
} {
  const scores = new Array(46).fill(0); // index 0 unused
  const totalDraws = draws.length;
  const latestDrawNo = draws[0].draw_no;

  // 시간 가중치 함수: 최근 회차일수록 높은 가중치
  function timeWeight(drawNo: number): number {
    const age = latestDrawNo - drawNo;
    // 지수 감쇠: 최근 = 1.0, 100회 전 = ~0.6, 500회 전 = ~0.14, 1000회 전 = ~0.02
    return Math.exp(-age / 200);
  }

  // === 1. 전체 빈도 (시간 가중, 20%) ===
  const freqWeighted: number[] = new Array(46).fill(0);
  const freqRaw: number[] = new Array(46).fill(0);
  for (const d of draws) {
    const tw = timeWeight(d.draw_no);
    for (const n of getNumbers(d)) {
      freqWeighted[n] += tw;
      freqRaw[n]++;
    }
  }
  const maxFW = Math.max(...freqWeighted.slice(1));
  const minFW = Math.min(...freqWeighted.slice(1));
  for (let i = 1; i <= 45; i++) {
    scores[i] += ((freqWeighted[i] - minFW) / (maxFW - minFW || 1)) * 20;
  }

  // === 2. 최근 50회 핫 넘버 (20%) ===
  const recent50 = draws.slice(0, 50);
  const recentFreq: number[] = new Array(46).fill(0);
  for (const d of recent50) for (const n of getNumbers(d)) recentFreq[n]++;
  const maxRecent = Math.max(...recentFreq.slice(1));
  for (let i = 1; i <= 45; i++) {
    scores[i] += (recentFreq[i] / (maxRecent || 1)) * 20;
  }

  // === 3. 소외 번호 회귀 (15%) ===
  const lastSeen: number[] = new Array(46).fill(-1);
  for (const d of draws) {
    for (const n of getNumbers(d)) {
      if (lastSeen[n] === -1) lastSeen[n] = d.draw_no;
    }
  }
  for (let i = 1; i <= 45; i++) {
    const gap = lastSeen[i] === -1 ? totalDraws : latestDrawNo - lastSeen[i];
    if (gap >= 15) scores[i] += 15;
    else if (gap >= 10) scores[i] += Math.min(gap / 20, 1) * 15;
    else if (gap >= 5) scores[i] += (gap / 20) * 8;
  }

  // === 4. 동반 출현 패턴 - 전체 데이터 (15%) ===
  const pairCount: Record<string, number> = {};
  const consecutivePairCount: Record<string, number> = {};
  for (const d of draws) {
    const nums = getNumbers(d).sort((a, b) => a - b);
    const tw = timeWeight(d.draw_no);
    // 모든 번호 쌍
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairCount[key] = (pairCount[key] || 0) + tw;
      }
    }
    // 연번 쌍
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i + 1] - nums[i] === 1) {
        const key = `${nums[i]}-${nums[i + 1]}`;
        consecutivePairCount[key] = (consecutivePairCount[key] || 0) + tw;
      }
    }
  }
  // 가장 자주 동반 출현하는 번호에 보너스
  const sortedPairs = Object.entries(pairCount).sort(([, a], [, b]) => b - a);
  const topPairThreshold = sortedPairs[0]?.[1] || 1;
  for (const [pair, count] of sortedPairs.slice(0, 100)) {
    const [a, b] = pair.split("-").map(Number);
    const bonus = (count / topPairThreshold) * 7.5;
    scores[a] += bonus;
    scores[b] += bonus;
  }
  // 연번 보너스
  for (const [pair, count] of Object.entries(consecutivePairCount)) {
    const [a, b] = pair.split("-").map(Number);
    const bonus = (count / totalDraws) * 7.5;
    scores[a] += bonus;
    scores[b] += bonus;
  }

  // === 5. 끝수 분석 - 전체 데이터 (10%) ===
  const endingFreq: number[] = new Array(10).fill(0);
  for (const d of draws) {
    for (const n of getNumbers(d)) endingFreq[n % 10]++;
  }
  const totalEndings = totalDraws * 6;
  const idealEndingRate = 1 / 10; // 10%
  for (let i = 1; i <= 45; i++) {
    const ending = i % 10;
    const rate = endingFreq[ending] / totalEndings;
    // 통계적 평균에 가까운 끝수에 보너스, 과다/과소는 감점
    const deviation = Math.abs(rate - idealEndingRate);
    scores[i] += Math.max(0, (1 - deviation * 10)) * 10;
  }

  // === 6. 구간 균형 반영 (10%) ===
  const sectionFreq = [0, 0, 0, 0, 0];
  for (const d of recent50) {
    for (const n of getNumbers(d)) {
      if (n <= 10) sectionFreq[0]++;
      else if (n <= 20) sectionFreq[1]++;
      else if (n <= 30) sectionFreq[2]++;
      else if (n <= 40) sectionFreq[3]++;
      else sectionFreq[4]++;
    }
  }
  const totalSectionNums = recent50.length * 6;
  const sectionSizes = [10, 10, 10, 10, 5];
  for (let i = 1; i <= 45; i++) {
    let secIdx: number;
    if (i <= 10) secIdx = 0;
    else if (i <= 20) secIdx = 1;
    else if (i <= 30) secIdx = 2;
    else if (i <= 40) secIdx = 3;
    else secIdx = 4;
    const expectedRate = sectionSizes[secIdx] / 45;
    const actualRate = sectionFreq[secIdx] / totalSectionNums;
    // 부족한 구간의 번호에 보너스
    if (actualRate < expectedRate) {
      scores[i] += 10;
    } else {
      scores[i] += 5;
    }
  }

  // === 7. 주기성 분석 - 전체 데이터 (10%) ===
  // 각 번호의 출현 간격 평균과 표준편차 기반
  for (let num = 1; num <= 45; num++) {
    const appearances: number[] = [];
    for (const d of draws) {
      if (getNumbers(d).includes(num)) appearances.push(d.draw_no);
    }
    if (appearances.length < 2) continue;
    appearances.sort((a, b) => b - a); // 최신순
    const gaps: number[] = [];
    for (let i = 0; i < appearances.length - 1; i++) {
      gaps.push(appearances[i] - appearances[i + 1]);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const currentGap = latestDrawNo - appearances[0];
    // 현재 미출현 기간이 평균 간격에 가까우면 보너스
    const ratio = currentGap / avgGap;
    if (ratio >= 0.8 && ratio <= 1.5) {
      scores[num] += 10; // "출현 타이밍"
    } else if (ratio > 1.5) {
      scores[num] += 7; // 과도하게 미출현 → 회귀 기대
    } else {
      scores[num] += 3; // 최근 나왔으면 낮은 점수
    }
  }

  // === 분석 요약 데이터 생성 ===
  const rankedScores = [...Array(45)]
    .map((_, i) => ({ num: i + 1, score: scores[i + 1] }))
    .sort((a, b) => b.score - a.score);

  const freqTop = [...Array(45)]
    .map((_, i) => ({ num: i + 1, count: freqRaw[i + 1] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentHot = [...Array(45)]
    .map((_, i) => ({ num: i + 1, count: recentFreq[i + 1] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const neglected = [...Array(45)]
    .map((_, i) => ({
      num: i + 1,
      gap: lastSeen[i + 1] === -1 ? totalDraws : latestDrawNo - lastSeen[i + 1],
    }))
    .filter((n) => n.gap >= 5)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 10);

  const sums = draws.map((d) => getNumbers(d).reduce((a, b) => a + b, 0));
  const avgSum = Math.round(sums.reduce((a, b) => a + b, 0) / sums.length);

  let consecutiveDraws = 0;
  for (const d of draws) {
    const nums = getNumbers(d).sort((a, b) => a - b);
    if (nums.some((n, i) => i < nums.length - 1 && nums[i + 1] - n === 1)) {
      consecutiveDraws++;
    }
  }
  const consecutiveRate = Math.round((consecutiveDraws / totalDraws) * 100);

  const topPairsRaw = sortedPairs.slice(0, 10).map(([pair, count]) => ({
    pair,
    count: Math.round(count * 10) / 10,
  }));

  const txt = apiTexts[locale];
  const analysis = txt.analysisTemplate
    .replace("{total}", String(totalDraws))
    .replace("{top5}", rankedScores.slice(0, 5).map((n) => n.num).join(", "))
    .replace("{neglected}", neglected.slice(0, 3).map((n) => `${n.num}(${n.gap}${txt.drawsLabel})`).join(", "))
    .replace("{avgSum}", String(avgSum))
    .replace("{consRate}", String(consecutiveRate));

  return {
    scores,
    analysis,
    details: {
      freqTop,
      recentHot,
      neglected,
      topPairs: topPairsRaw,
      avgSum,
      consecutiveRate,
    },
  };
}

/** 필터 체인: AC값, 홀짝, 고저, 끝수, 구간, 합계 */
function passesFilters(nums: number[]): boolean {
  const sorted = [...nums].sort((a, b) => a - b);

  if (calcAC(sorted) < 7) return false;

  const oddCount = sorted.filter((n) => n % 2 === 1).length;
  if (oddCount < 2 || oddCount > 4) return false;

  const highCount = sorted.filter((n) => n >= 23).length;
  if (highCount < 2 || highCount > 4) return false;

  const endings = new Map<number, number>();
  for (const n of sorted) {
    const e = n % 10;
    endings.set(e, (endings.get(e) || 0) + 1);
  }
  if (Math.max(...endings.values()) > 2) return false;

  const sections = [0, 0, 0, 0, 0];
  for (const n of sorted) {
    if (n <= 10) sections[0]++;
    else if (n <= 20) sections[1]++;
    else if (n <= 30) sections[2]++;
    else if (n <= 40) sections[3]++;
    else sections[4]++;
  }
  if (sections.filter((s) => s > 0).length < 3) return false;

  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum < 100 || sum > 200) return false;

  return true;
}

/** 가중 랜덤 선택으로 6개 번호 생성 */
function weightedPick(scores: number[]): number[] {
  const totalWeight = scores.slice(1).reduce((a, b) => a + b, 0);
  const pick = new Set<number>();

  while (pick.size < 6) {
    let r = Math.random() * totalWeight;
    for (let i = 1; i <= 45; i++) {
      r -= scores[i];
      if (r <= 0 && !pick.has(i)) {
        pick.add(i);
        break;
      }
    }
  }

  return Array.from(pick).sort((a, b) => a - b);
}

/** 필터를 통과하는 5세트 생성 */
function generateSets(
  scores: number[],
  count: number,
  locale: Locale = "ko"
): { sets: number[][]; reasons: string[] } {
  const txt = apiTexts[locale];
  const sets: number[][] = [];
  const reasons: string[] = [];
  let attempts = 0;

  while (sets.length < count && attempts < 50000) {
    const nums = weightedPick(scores);
    attempts++;
    if (passesFilters(nums)) {
      const tooSimilar = sets.some(
        (existing) => nums.filter((n) => existing.includes(n)).length >= 4
      );
      if (!tooSimilar) {
        sets.push(nums);

        const sum = nums.reduce((a, b) => a + b, 0);
        const oddCount = nums.filter((n) => n % 2 === 1).length;
        const hasConsecutive = nums.some(
          (n, i) => i < nums.length - 1 && nums[i + 1] - n === 1
        );
        const avgScore =
          Math.round((nums.reduce((s, n) => s + scores[n], 0) / 6) * 10) / 10;

        reasons.push(
          `${txt.sumLabel} ${sum}, ${txt.oddEvenLabel} ${oddCount}:${6 - oddCount}, ` +
            `${txt.acLabel} ${calcAC(nums)}, ` +
            (hasConsecutive ? `${txt.consecutive}, ` : "") +
            `${txt.avgScoreLabel} ${avgScore}`
        );
      }
    }
  }

  return { sets, reasons };
}

export async function POST(request: NextRequest) {
  let locale: Locale = "ko";
  try {
    const body = await request.json();
    if (body.locale && locales.includes(body.locale)) {
      locale = body.locale;
    }
  } catch {
    // no body, default to ko
  }

  const draws = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC")
    .all() as DrawResult[];

  if (draws.length === 0) {
    return NextResponse.json(
      { error: apiTexts[locale].noData },
      { status: 400 }
    );
  }

  const { scores, analysis, details } = buildScores(draws, locale);
  const { sets, reasons } = generateSets(scores, 5, locale);
  const nextDrawNo = draws[0].draw_no + 1;

  return NextResponse.json({
    sets,
    analysis,
    reasons,
    details,
    targetDraw: nextDrawNo,
    analyzedDraws: draws.length,
    generatedAt: new Date().toISOString(),
  });
}
