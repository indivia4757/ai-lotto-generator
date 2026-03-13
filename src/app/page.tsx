"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LottoBallSet } from "@/components/lotto/lotto-ball";
import Link from "next/link";

const ALGORITHMS = [
  { slug: "frequency", name: "빈도 분석", desc: "핫/콜드 넘버 가중 선택", icon: "📊" },
  { slug: "neglected", name: "소외 번호", desc: "최근 미출현 번호 우선", icon: "🔍" },
  { slug: "balanced", name: "균형 조합", desc: "홀짝·고저·구간 균형", icon: "⚖️" },
  { slug: "consecutive", name: "연번 패턴", desc: "연속번호 출현 확률 반영", icon: "🔗" },
  { slug: "sum-range", name: "합계 범위", desc: "합계 100~200 범위 제한", icon: "🎯" },
  { slug: "hybrid", name: "AI 하이브리드", desc: "4가지 분석 앙상블", icon: "🤖" },
  { slug: "delta", name: "델타 시스템", desc: "번호 간 차이 분포 역산", icon: "📐" },
  { slug: "random", name: "완전 랜덤", desc: "crypto 기반 순수 랜덤", icon: "🎲" },
];

export default function HomePage() {
  const [results, setResults] = useState<{ slug: string; name: string; sets: number[][] } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function generate(slug: string) {
    setLoading(slug);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithmSlug: slug, count: 5 }),
      });
      const data = await res.json();
      setResults({ slug: data.algorithm.slug, name: data.algorithm.name, sets: data.sets });
    } catch {
      // 오프라인 fallback
      const sets: number[][] = [];
      for (let i = 0; i < 5; i++) {
        const s = new Set<number>();
        while (s.size < 6) s.add(Math.floor(Math.random() * 45) + 1);
        sets.push(Array.from(s).sort((a, b) => a - b));
      }
      setResults({ slug, name: "오프라인 랜덤", sets });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AI 로또 번호 생성기</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          8종 알고리즘으로 분석된 번호를 생성하고, 추천 기록을 관리하세요.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ALGORITHMS.map((algo) => (
          <Card key={algo.slug} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{algo.icon}</span>
                {algo.name}
              </CardTitle>
              <CardDescription className="text-xs">{algo.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="sm"
                onClick={() => generate(algo.slug)}
                disabled={loading !== null}
              >
                {loading === algo.slug ? "생성 중..." : "번호 생성"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{results.name} 결과</span>
              <Link href="/generate">
                <Button variant="outline" size="sm">상세 설정</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.sets.map((set, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-6">#{i + 1}</span>
                <LottoBallSet numbers={set} />
                <span className="text-xs text-muted-foreground ml-auto">
                  합계: {set.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/draws">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">📋 당첨 결과</CardTitle>
              <CardDescription>역대 당첨번호 조회</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/recommendations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">📝 추천 기록</CardTitle>
              <CardDescription>생성한 번호 관리</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/stats">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">📈 통계 분석</CardTitle>
              <CardDescription>빈도, 패턴, 구간 분석</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>
    </div>
  );
}
