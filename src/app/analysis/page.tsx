"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ANALYSIS_TYPES = [
  {
    type: "summary",
    title: "통계 요약",
    desc: "전체 당첨 데이터의 핵심 통계 분석 프롬프트 생성",
  },
  {
    type: "pattern",
    title: "패턴 분석",
    desc: "최근 회차의 트렌드와 패턴 분석 프롬프트 생성",
  },
  {
    type: "recommend",
    title: "번호 추천",
    desc: "데이터 기반 다음 회차 번호 추천 프롬프트 생성",
  },
];

interface AnalysisResult {
  prompt: string;
  type: string;
  analyzedDraws: number;
  instruction: string;
}

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(type: string) {
    setLoading(type);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/analysis?type=${type}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExport(format: "json" | "csv") {
    window.open(`/api/export?format=${format}&limit=500`, "_blank");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">CLI 분석</h1>
        <p className="text-muted-foreground mt-1">
          Claude Code / Codex CLI로 로또 데이터를 분석하세요
        </p>
      </div>

      {/* 데이터 내보내기 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">데이터 내보내기</CardTitle>
          <CardDescription>
            분석에 사용할 데이터를 다운로드합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            JSON 다운로드
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            CSV 다운로드
          </Button>
        </CardContent>
      </Card>

      {/* 프롬프트 생성 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ANALYSIS_TYPES.map((item) => (
          <Card
            key={item.type}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => !loading && handleGenerate(item.type)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="sm"
                disabled={loading !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerate(item.type);
                }}
              >
                {loading === item.type ? "생성 중..." : "프롬프트 생성"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {ANALYSIS_TYPES.find((t) => t.type === result.type)?.title} 프롬프트
              </span>
              <Button size="sm" onClick={handleCopy}>
                {copied ? "복사됨!" : "클립보드 복사"}
              </Button>
            </CardTitle>
            <CardDescription>
              {result.analyzedDraws}회차 데이터 기반 | 아래 프롬프트를 CLI에
              붙여넣으세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-[500px]">
              {result.prompt}
            </pre>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-2">사용 방법:</p>
              <code className="block bg-background px-2 py-1 rounded mb-1">
                claude &quot;위 프롬프트 붙여넣기&quot;
              </code>
              <code className="block bg-background px-2 py-1 rounded">
                codex &quot;위 프롬프트 붙여넣기&quot;
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
