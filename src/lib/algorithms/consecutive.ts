import type { DrawResult } from "@/lib/db/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

/** 4. 연번 패턴 — 연속번호 포함 확률 반영 */
export const consecutiveAlgorithm: LottoAlgorithm = {
  slug: "consecutive",
  name: "연번 패턴",
  generate(_history: DrawResult[], count: number): number[][] {
    const generator = (): number[] => {
      const selected = new Set<number>();

      // 약 60% 확률로 연번 쌍 1개 포함
      if (Math.random() < 0.6) {
        const base = Math.floor(Math.random() * 44) + 1; // 1~44
        selected.add(base);
        selected.add(base + 1);
      }

      // 나머지 랜덤 채움
      while (selected.size < 6) {
        selected.add(Math.floor(Math.random() * 45) + 1);
      }

      return Array.from(selected);
    };

    return generateWithFilter(generator, count);
  },
};
