import type { DrawResult } from "@/lib/db/types";

export interface LottoAlgorithm {
  slug: string;
  name: string;
  generate(history: DrawResult[], count: number): number[][];
}

export interface GenerateRequest {
  algorithmSlug: string;
  count: number; // 생성할 세트 수
}

export interface GenerateResponse {
  algorithm: { slug: string; name: string };
  sets: number[][];
  generatedAt: string;
}
