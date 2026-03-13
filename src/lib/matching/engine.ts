import type { DrawResult, Recommendation } from "@/lib/supabase/types";

export interface MatchingResult {
  recommendationId: number;
  drawNo: number;
  matchedNumbers: number[];
  matchedBonus: boolean;
  rank: number | null;
}

function getDrawNumbers(draw: DrawResult): number[] {
  return [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6];
}

function determineRank(matchCount: number, bonusMatch: boolean): number | null {
  if (matchCount === 6) return 1;
  if (matchCount === 5 && bonusMatch) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
}

export function matchRecommendation(
  recommendation: Recommendation,
  draw: DrawResult
): MatchingResult {
  const drawNums = getDrawNumbers(draw);
  const recNums = recommendation.numbers;

  const matchedNumbers = recNums.filter((n) => drawNums.includes(n));
  const matchedBonus = recNums.includes(draw.bonus_num);
  const rank = determineRank(matchedNumbers.length, matchedBonus);

  return {
    recommendationId: recommendation.id,
    drawNo: draw.draw_no,
    matchedNumbers,
    matchedBonus,
    rank,
  };
}
