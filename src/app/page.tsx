"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LottoBallSet } from "@/components/lotto/lotto-ball";

interface AiResult {
  sets: number[][];
  analysis: string;
  reasons: string[];
  details: {
    freqTop: { num: number; count: number }[];
    recentHot: { num: number; count: number }[];
    neglected: { num: number; gap: number }[];
    topPairs: { pair: string; count: number }[];
    avgSum: number;
    consecutiveRate: number;
  };
  targetDraw: number;
  analyzedDraws: number;
  generatedAt: string;
}

export default function HomePage() {
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecommend() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-recommend", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "분석에 실패했습니다.");
        return;
      }

      setResult(data);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-4xl font-bold tracking-tight">
          AI 로또 번호 추천
        </h1>
        <p className="text-muted-foreground text-lg">
          전체 당첨 히스토리를 종합 분석하여
          <br />
          최적의 번호 조합을 추천합니다.
        </p>
      </section>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">AI 분석 추천</CardTitle>
          <CardDescription>
            빈도, 트렌드, 소외번호, 동반출현, 끝수, 구간균형, 주기성
            <br />
            7가지 관점의 종합 앙상블 분석
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            size="lg"
            onClick={handleRecommend}
            disabled={loading}
            className="px-12 py-6 text-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                분석 중...
              </span>
            ) : (
              "번호 추천 받기"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="pt-6 text-center text-red-700 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{result.targetDraw}회차 추천 번호</span>
                <span className="text-sm font-normal text-muted-foreground">
                  전체 {result.analyzedDraws}회 분석
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.sets.map((set, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-mono w-6">
                    #{i + 1}
                  </span>
                  <LottoBallSet numbers={set} />
                  <span className="text-xs text-muted-foreground ml-auto">
                    합계: {set.reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">분석 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{result.analysis}</p>
              <div className="space-y-2">
                {result.reasons.map((reason, i) => (
                  <div
                    key={i}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="font-mono text-foreground shrink-0">
                      #{i + 1}
                    </span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">분석 상세</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">
                  전체 빈도 TOP 10
                </h4>
                <p className="text-muted-foreground">
                  {result.details.freqTop
                    .map((f) => `${f.num}(${f.count}회)`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">
                  최근 50회 핫 넘버
                </h4>
                <p className="text-muted-foreground">
                  {result.details.recentHot
                    .map((f) => `${f.num}(${f.count}회)`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">
                  장기 미출현 번호
                </h4>
                <p className="text-muted-foreground">
                  {result.details.neglected
                    .map((n) => `${n.num}(${n.gap}회 미출현)`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">
                  동반 출현 TOP 쌍
                </h4>
                <p className="text-muted-foreground">
                  {result.details.topPairs
                    .map((p) => `[${p.pair}]`)
                    .join(", ")}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <h4 className="font-medium mb-1">합계 평균</h4>
                  <p className="text-muted-foreground">
                    {result.details.avgSum}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">연번 출현율</h4>
                  <p className="text-muted-foreground">
                    {result.details.consecutiveRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
