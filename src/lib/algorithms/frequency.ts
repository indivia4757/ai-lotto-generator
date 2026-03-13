import type { DrawResult } from "@/lib/supabase/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

/** 1. 빈도 분석 — 핫/콜드 넘버 가중 선택 */
export const frequencyAlgorithm: LottoAlgorithm = {
  slug: "frequency",
  name: "빈도 분석",
  generate(history: DrawResult[], count: number): number[][] {
    const recentN = Math.min(history.length, 50);
    const recent = history.slice(0, recentN);

    // 번호별 출현 빈도
    const freq = new Map<number, number>();
    for (let i = 1; i <= 45; i++) freq.set(i, 0);
    for (const d of recent) {
      for (const n of getNumbers(d)) {
        freq.set(n, (freq.get(n) || 0) + 1);
      }
    }

    // 가중치: 출현 빈도 + 최소 1 (콜드 넘버도 최소 확률)
    const weights: number[] = [];
    for (let i = 1; i <= 45; i++) {
      weights.push((freq.get(i) || 0) + 1);
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
