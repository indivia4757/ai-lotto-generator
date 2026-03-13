import type { DrawResult } from "@/lib/supabase/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter, sumNumbers } from "./filters";

/** 5. 합계 범위 — 합계 100~200 범위 제한 */
export const sumRangeAlgorithm: LottoAlgorithm = {
  slug: "sum-range",
  name: "합계 범위",
  generate(_history: DrawResult[], count: number): number[][] {
    const generator = (): number[] => {
      let nums: number[];
      let attempts = 0;
      do {
        const selected = new Set<number>();
        while (selected.size < 6) {
          selected.add(Math.floor(Math.random() * 45) + 1);
        }
        nums = Array.from(selected);
        attempts++;
      } while ((sumNumbers(nums) < 100 || sumNumbers(nums) > 200) && attempts < 1000);

      return nums;
    };

    return generateWithFilter(generator, count);
  },
};
