import type { LottoAlgorithm } from "./types";
import { frequencyAlgorithm } from "./frequency";
import { neglectedAlgorithm } from "./neglected";
import { balancedAlgorithm } from "./balanced";
import { consecutiveAlgorithm } from "./consecutive";
import { sumRangeAlgorithm } from "./sum-range";
import { hybridAlgorithm } from "./hybrid";
import { deltaAlgorithm } from "./delta";
import { randomAlgorithm } from "./random";

const algorithms: LottoAlgorithm[] = [
  frequencyAlgorithm,
  neglectedAlgorithm,
  balancedAlgorithm,
  consecutiveAlgorithm,
  sumRangeAlgorithm,
  hybridAlgorithm,
  deltaAlgorithm,
  randomAlgorithm,
];

const registry = new Map<string, LottoAlgorithm>();
for (const algo of algorithms) {
  registry.set(algo.slug, algo);
}

export function getAlgorithm(slug: string): LottoAlgorithm | undefined {
  return registry.get(slug);
}

export function getAllAlgorithms(): LottoAlgorithm[] {
  return algorithms;
}

export { algorithms };
