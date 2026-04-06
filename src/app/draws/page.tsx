"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LottoBallSet } from "@/components/lotto/lotto-ball";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/context";
import type { DrawResult } from "@/lib/db/types";

export default function DrawsPage() {
  const { t } = useI18n();
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const fetchDraws = useCallback(async () => {
    try {
      const res = await fetch("/api/draws");
      const data = await res.json();
      setDraws(data.draws || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/admin/import-draws", { method: "POST" });
      const data = await res.json();
      alert(data.message || data.error);
      fetchDraws();
    } catch {
      alert("Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleBackfill() {
    setBackfilling(true);
    try {
      const res = await fetch("/api/admin/backfill-draws", { method: "POST" });
      const data = await res.json();
      alert(data.message);
      fetchDraws();
    } catch {
      alert("Backfill failed");
    } finally {
      setBackfilling(false);
    }
  }

  function formatMoney(amount: number | null): string {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR").format(amount) + "\u{20A9}";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("draws.title")}</h1>
        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={importing} size="sm">
            {importing ? t("draws.importing") : t("draws.import")}
          </Button>
          <Button
            onClick={handleBackfill}
            disabled={backfilling}
            variant="outline"
            size="sm"
          >
            {backfilling ? t("draws.backfilling") : t("draws.backfill")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : draws.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>{t("draws.empty")}</p>
            <p className="text-sm mt-2">{t("draws.emptyHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {draws.map((draw) => (
            <Card key={draw.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{t("draws.round", { no: draw.draw_no })}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {draw.draw_date}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <LottoBallSet
                    numbers={[
                      draw.num1,
                      draw.num2,
                      draw.num3,
                      draw.num4,
                      draw.num5,
                      draw.num6,
                    ]}
                    bonusNumber={draw.bonus_num}
                  />
                  <div className="text-right text-sm text-muted-foreground">
                    <div>
                      {t("draws.firstPrize")} {formatMoney(draw.first_prize)}
                    </div>
                    {draw.first_winners !== null && (
                      <div>
                        {t("draws.winners", { count: draw.first_winners })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
