"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ANALYSIS_TYPES = [
  {
    type: "summary",
    title: "통계 요약",
    desc: "전체 당첨 데이터의 핵심 통계 분석",
    icon: "📊",
  },
  {
    type: "pattern",
    title: "패턴 분석",
    desc: "최근 회차의 트렌드와 패턴 발견",
    icon: "🔍",
  },
  {
    type: "recommend",
    title: "AI 번호 추천",
    desc: "데이터 기반 다음 회차 번호 5세트 추천",
    icon: "🤖",
  },
];

interface AnalysisResult {
  analysis: string;
  type: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number } | null;
  analyzedDraws: number;
}

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(type: string) {
    setLoading(type);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">AI 분석</h1>
        <p className="text-muted-foreground mt-1">
          OpenAI GPT 기반 로또 데이터 분석
        </p>
      </div>

      {/* 분석 유형 선택 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ANALYSIS_TYPES.map((item) => (
          <Card
            key={item.type}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => !loading && handleAnalyze(item.type)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                {item.title}
              </CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="sm"
                disabled={loading !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze(item.type);
                }}
              >
                {loading === item.type ? "분석 중..." : "분석하기"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 에러 표시 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-muted-foreground">AI가 분석 중입니다...</span>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {/* 결과 표시 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {ANALYSIS_TYPES.find((t) => t.type === result.type)?.icon}{" "}
                {ANALYSIS_TYPES.find((t) => t.type === result.type)?.title} 결과
              </span>
            </CardTitle>
            <CardDescription>
              {result.analyzedDraws}회차 데이터 분석 | 모델: {result.model}
              {result.tokens && ` | 토큰: ${result.tokens.total.toLocaleString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {result.analysis.split("\n").map((line, i) => {
                if (line.startsWith("### ")) {
                  return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace("### ", "")}</h3>;
                }
                if (line.startsWith("## ")) {
                  return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.replace("## ", "")}</h2>;
                }
                if (line.startsWith("# ")) {
                  return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.replace("# ", "")}</h1>;
                }
                if (line.startsWith("- ") || line.startsWith("* ")) {
                  return <li key={i} className="ml-4">{line.replace(/^[-*] /, "")}</li>;
                }
                if (line.match(/^\d+\. /)) {
                  return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, "")}</li>;
                }
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <p key={i} className="font-bold mt-3">{line.replace(/\*\*/g, "")}</p>;
                }
                if (line.trim() === "") {
                  return <br key={i} />;
                }
                // bold 처리
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i}>
                    {parts.map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j}>{part.replace(/\*\*/g, "")}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
