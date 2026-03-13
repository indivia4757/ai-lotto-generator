import type { DrawResult } from "@/lib/supabase/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

/** 6. AI 하이브리드 — 빈도30%+패턴30%+구간20%+소외20% 앙상블 */
export const hybridAlgorithm: LottoAlgorithm = {
  slug: "hybrid",
  name: "AI 하이브리드",
  generate(history: DrawResult[], count: number): number[][] {
    const recentN = Math.min(history.length, 50);
    const recent = history.slice(0, recentN);

    // 빈도 점수 (30%)
    const freq = new Array(45).fill(0);
    for (const d of recent) {
      for (const n of getNumbers(d)) freq[n - 1]++;
    }
    const maxFreq = Math.max(...freq, 1);

    // 소외 점수 (20%) — 미출현 기간
    const lastSeen = new Array(45).fill(0);
    for (let idx = 0; idx < recent.length; idx++) {
      for (const n of getNumbers(recent[idx])) {
        if (lastSeen[n - 1] === 0) lastSeen[n - 1] = recentN - idx;
      }
    }

    // 구간 점수 (20%) — 구간별 균형 보너스
    const sectionCounts = [0, 0, 0, 0, 0];
    for (const d of recent) {
      for (const n of getNumbers(d)) {
        if (n <= 10) sectionCounts[0]++;
        else if (n <= 20) sectionCounts[1]++;
        else if (n <= 30) sectionCounts[2]++;
        else if (n <= 40) sectionCounts[3]++;
        else sectionCounts[4]++;
      }
    }
    const avgSection = sectionCounts.reduce((a, b) => a + b, 0) / 5;

    // 패턴 점수 (30%) — 연번 빈도
    const pairFreq = new Array(44).fill(0);
    for (const d of recent) {
      const nums = getNumbers(d).sort((a, b) => a - b);
      for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i + 1] - nums[i] === 1) {
          pairFreq[nums[i] - 1]++;
        }
      }
    }

    // 종합 가중치
    const weights: number[] = [];
    for (let i = 0; i < 45; i++) {
      const freqScore = (freq[i] / maxFreq) * 0.3;
      const neglectScore = (lastSeen[i] === 0 ? 1 : (recentN - lastSeen[i]) / recentN) * 0.2;
      const sIdx = i < 10 ? 0 : i < 20 ? 1 : i < 30 ? 2 : i < 40 ? 3 : 4;
      const sectionScore = (1 - sectionCounts[sIdx] / (avgSection * 5)) * 0.2 + 0.2;
      const patternScore = (i < 44 ? pairFreq[i] / (recentN || 1) : 0) * 0.3;
      weights.push(freqScore + neglectScore + sectionScore + patternScore + 0.1);
    }
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const generator = (): number[] => {
      const selected = new Set<number>();
      while (selected.size < 6) {
        let r = Math.random() * totalWeight;
        for (let i = 0; i < 45; i++) {
          r -= weights[i];
          if (r <= 0) {
            selected.add(i + 1);
            break;
          }
        }
      }
      return Array.from(selected);
    };

    return generateWithFilter(generator, count);
  },
};
