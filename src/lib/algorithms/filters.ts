/**
 * 공통 필터 체인: AC값≥7, 홀짝(2:4~4:2), 고저, 끝수(동일끝수≤2), 구간분포
 */

/** AC값 (Arithmetic Complexity) 계산 */
export function calcAC(nums: number[]): number {
  const diffs = new Set<number>();
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      diffs.add(Math.abs(nums[i] - nums[j]));
    }
  }
  return diffs.size - (nums.length - 1);
}

/** 홀수 개수 */
export function countOdd(nums: number[]): number {
  return nums.filter((n) => n % 2 === 1).length;
}

/** 고저 비율 (23이상 고) */
export function countHigh(nums: number[]): number {
  return nums.filter((n) => n >= 23).length;
}

/** 끝수별 그룹 최대 개수 */
export function maxSameEnding(nums: number[]): number {
  const endings = new Map<number, number>();
  for (const n of nums) {
    const e = n % 10;
    endings.set(e, (endings.get(e) || 0) + 1);
  }
  return Math.max(...endings.values());
}

/** 구간별 분포 (1~10, 11~20, 21~30, 31~40, 41~45) */
export function sectionDistribution(nums: number[]): number[] {
  const sections = [0, 0, 0, 0, 0];
  for (const n of nums) {
    if (n <= 10) sections[0]++;
    else if (n <= 20) sections[1]++;
    else if (n <= 30) sections[2]++;
    else if (n <= 40) sections[3]++;
    else sections[4]++;
  }
  return sections;
}

/** 합계 */
export function sumNumbers(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

/** 필터 체인 통과 여부 */
export function passesFilters(nums: number[]): boolean {
  const sorted = [...nums].sort((a, b) => a - b);

  // AC값 ≥ 7
  if (calcAC(sorted) < 7) return false;

  // 홀짝 비율 2:4 ~ 4:2
  const oddCount = countOdd(sorted);
  if (oddCount < 2 || oddCount > 4) return false;

  // 고저 비율 2:4 ~ 4:2
  const highCount = countHigh(sorted);
  if (highCount < 2 || highCount > 4) return false;

  // 동일 끝수 ≤ 2
  if (maxSameEnding(sorted) > 2) return false;

  // 최소 3개 구간 이상 분포
  const sections = sectionDistribution(sorted);
  const occupiedSections = sections.filter((s) => s > 0).length;
  if (occupiedSections < 3) return false;

  return true;
}

/** 필터를 통과하는 번호 세트를 생성 (최대 시도 횟수 제한) */
export function generateWithFilter(
  generator: () => number[],
  count: number,
  maxAttempts: number = 10000
): number[][] {
  const results: number[][] = [];
  let attempts = 0;

  while (results.length < count && attempts < maxAttempts) {
    const nums = generator();
    attempts++;
    if (passesFilters(nums)) {
      results.push([...nums].sort((a, b) => a - b));
    }
  }

  // 필터를 충분히 통과하지 못하면 남은 수만큼 필터 없이 생성
  while (results.length < count) {
    const nums = generator();
    results.push([...nums].sort((a, b) => a - b));
  }

  return results;
}
