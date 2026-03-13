import type { DrawResult } from "@/lib/supabase/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

/** 2. 소외 번호 — 최근 N회 미출현 번호 우선 선택 */
export const neglectedAlgorithm: LottoAlgorithm = {
  slug: "neglected",
  name: "소외 번호",
  generate(history: DrawResult[], count: number): number[][] {
    const recentN = Math.min(history.length, 20);
    const recent = history.slice(0, recentN);

    // 각 번호의 마지막 출현 회차 (0 = 미출현)
    const lastSeen = new Map<number, number>();
    for (let i = 1; i <= 45; i++) lastSeen.set(i, 0);

    for (let idx = 0; idx < recent.length; idx++) {
      for (const n of getNumbers(recent[idx])) {
        if ((lastSeen.get(n) || 0) === 0) {
          lastSeen.set(n, recentN - idx); // 최근일수록 큰 값
        }
      }
    }

    // 미출현(0) 또는 오래전 출현일수록 높은 가중치
    const weights: number[] = [];
    for (let i = 1; i <= 45; i++) {
      const seen = lastSeen.get(i) || 0;
      weights.push(seen === 0 ? recentN + 5 : recentN - seen + 1);
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
