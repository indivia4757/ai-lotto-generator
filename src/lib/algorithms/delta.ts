import type { DrawResult } from "@/lib/db/types";
import type { LottoAlgorithm } from "./types";
import { generateWithFilter } from "./filters";

/** 7. 델타 시스템 — 번호 간 차이 분포 역산 */
export const deltaAlgorithm: LottoAlgorithm = {
  slug: "delta",
  name: "델타 시스템",
  generate(_history: DrawResult[], count: number): number[][] {
    // 통계 기반 일반적인 델타 분포 (1~15 범위가 많음)
    const deltaWeights = [
      0, 3, 5, 7, 8, 9, 8, 7, 6, 5,
      4, 3, 3, 2, 2, 1, 1, 1, 1, 1,
    ];
    const totalDelta = deltaWeights.reduce((a, b) => a + b, 0);

    function pickDelta(): number {
      let r = Math.random() * totalDelta;
      for (let i = 0; i < deltaWeights.length; i++) {
        r -= deltaWeights[i];
        if (r <= 0) return i + 1;
      }
      return 5;
    }

    const generator = (): number[] => {
      let attempts = 0;
      while (attempts < 100) {
        attempts++;
        // 첫 번호: 1~8 범위
        const first = Math.floor(Math.random() * 8) + 1;
        const nums = [first];

        for (let i = 0; i < 5; i++) {
          const delta = pickDelta();
          nums.push(nums[nums.length - 1] + delta);
        }

        // 45 초과 검사
        if (nums[nums.length - 1] <= 45 && new Set(nums).size === 6) {
          return nums;
        }
      }

      // fallback: 랜덤
      const selected = new Set<number>();
      while (selected.size < 6) {
        selected.add(Math.floor(Math.random() * 45) + 1);
      }
      return Array.from(selected);
    };

    return generateWithFilter(generator, count);
  },
};
