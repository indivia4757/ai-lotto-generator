"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LottoBallSet } from "@/components/lotto/lotto-ball";
import { toast } from "sonner";

const ALGORITHMS = [
  { slug: "frequency", name: "빈도 분석" },
  { slug: "neglected", name: "소외 번호" },
  { slug: "balanced", name: "균형 조합" },
  { slug: "consecutive", name: "연번 패턴" },
  { slug: "sum-range", name: "합계 범위" },
  { slug: "hybrid", name: "AI 하이브리드" },
  { slug: "delta", name: "델타 시스템" },
  { slug: "random", name: "완전 랜덤" },
];

interface GeneratedSet {
  numbers: number[];
  saved: boolean;
}

export default function GeneratePage() {
  const [algorithm, setAlgorithm] = useState("hybrid");
  const [count, setCount] = useState("5");
  const [results, setResults] = useState<GeneratedSet[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithmSlug: algorithm, count: Number(count) }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error("생성 실패: " + JSON.stringify(data.error));
        return;
      }
      setResults(data.sets.map((nums: number[]) => ({ numbers: nums, saved: false })));
      toast.success(`${data.algorithm.name}으로 ${data.sets.length}세트 생성 완료`);
    } catch {
      toast.error("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(index: number) {
    const set = results[index];
    // 알고리즘 ID 가져오기 (slug 기반)
    const algoInfo = ALGORITHMS.find((a) => a.slug === algorithm);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithmId: ALGORITHMS.indexOf(algoInfo!) + 1,
          algorithmSlug: algorithm,
          numbers: set.numbers,
        }),
      });
      if (res.ok) {
        const updated = [...results];
        updated[index] = { ...set, saved: true };
        setResults(updated);
        toast.success("추천 기록에 저장되었습니다");
      } else {
        toast.error("저장 실패");
      }
    } catch {
      toast.error("서버 연결 실패");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">번호 생성</h1>

      <Card>
        <CardHeader>
          <CardTitle>생성 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>알고리즘</Label>
              <Select value={algorithm} onValueChange={(v) => v && setAlgorithm(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALGORITHMS.map((a) => (
                    <SelectItem key={a.slug} value={a.slug}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>세트 수</Label>
              <Select value={count} onValueChange={(v) => v && setCount(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 5, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}세트
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "생성 중..." : "번호 생성하기"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>생성 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((set, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                <LottoBallSet numbers={set.numbers} />
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    합:{set.numbers.reduce((a, b) => a + b, 0)}
                  </span>
                  <Button
                    variant={set.saved ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleSave(i)}
                    disabled={set.saved}
                  >
                    {set.saved ? "저장됨" : "저장"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
