import type { DrawResult } from "@/lib/db/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

/** 3. 균형 조합 — 홀짝·고저·구간 균형 */
export const balancedAlgorithm: LottoAlgorithm = {
  slug: "balanced",
  name: "균형 조합",
  generate(_history: DrawResult[], count: number): number[][] {
    // 구간: 1~9, 10~19, 20~29, 30~39, 40~45
    const sections = [
      Array.from({ length: 9 }, (_, i) => i + 1),
      Array.from({ length: 10 }, (_, i) => i + 10),
      Array.from({ length: 10 }, (_, i) => i + 20),
      Array.from({ length: 10 }, (_, i) => i + 30),
      Array.from({ length: 6 }, (_, i) => i + 40),
    ];

    const generator = (): number[] => {
      const selected = new Set<number>();

      // 각 구간에서 최소 1개 선택 (5개 구간 → 5개)
      for (const section of sections) {
        const pick = section[Math.floor(Math.random() * section.length)];
        selected.add(pick);
      }

      // 나머지 1개 랜덤 구간에서 추가
      while (selected.size < 6) {
        const section = sections[Math.floor(Math.random() * sections.length)];
        const pick = section[Math.floor(Math.random() * section.length)];
        selected.add(pick);
      }

      return Array.from(selected);
    };

    return generateWithFilter(generator, count);
  },
};
