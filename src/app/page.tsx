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
import { useI18n } from "@/lib/i18n/context";

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
  const { t, locale } = useI18n();
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecommend() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("home.error"));
        return;
      }

      setResult(data);
    } catch {
      setError(t("home.errorServer"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-4xl font-bold tracking-tight">
          {t("home.title")}
        </h1>
        <p className="text-muted-foreground text-lg whitespace-pre-line">
          {t("home.subtitle")}
        </p>
      </section>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("home.cardTitle")}</CardTitle>
          <CardDescription className="whitespace-pre-line">
            {t("home.cardDesc")}
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
                {t("home.loading")}
              </span>
            ) : (
              t("home.button")
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
                <span>
                  {t("home.resultTitle", { draw: result.targetDraw })}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {t("home.analyzedDraws", { count: result.analyzedDraws })}
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
                    {t("home.sum")}: {set.reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("home.analysisSummary")}
              </CardTitle>
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
              <CardTitle className="text-base">
                {t("home.analysisDetail")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">{t("home.freqTop")}</h4>
                <p className="text-muted-foreground">
                  {result.details.freqTop
                    .map((f) => `${f.num}(${f.count}${t("home.times")})`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">{t("home.recentHot")}</h4>
                <p className="text-muted-foreground">
                  {result.details.recentHot
                    .map((f) => `${f.num}(${f.count}${t("home.times")})`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">{t("home.neglected")}</h4>
                <p className="text-muted-foreground">
                  {result.details.neglected
                    .map((n) => `${n.num}(${n.gap}${t("home.missed")})`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">{t("home.topPairs")}</h4>
                <p className="text-muted-foreground">
                  {result.details.topPairs
                    .map((p) => `[${p.pair}]`)
                    .join(", ")}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <h4 className="font-medium mb-1">{t("home.avgSum")}</h4>
                  <p className="text-muted-foreground">
                    {result.details.avgSum}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">
                    {t("home.consecutiveRate")}
                  </h4>
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
