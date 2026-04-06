import type { DrawResult } from "@/lib/db/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

/** 8. 완전 랜덤 — crypto 기반 순수 랜덤 */
export const randomAlgorithm: LottoAlgorithm = {
  slug: "random",
  name: "완전 랜덤",
  generate(_history: DrawResult[], count: number): number[][] {
    const generator = (): number[] => {
      const selected = new Set<number>();
      while (selected.size < 6) {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        selected.add((arr[0] % 45) + 1);
      }
      return Array.from(selected);
    };

    return generateWithFilter(generator, count);
  },
};
