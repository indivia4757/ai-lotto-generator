"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LottoBallSet } from "@/components/lotto/lotto-ball";
import { Skeleton } from "@/components/ui/skeleton";
import type { DrawResult } from "@/lib/supabase/types";

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [seeding, setSeeding] = useState(false);

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

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-draws", { method: "POST" });
      const data = await res.json();
      alert(data.message);
      fetchDraws();
    } catch {
      alert("시드 데이터 삽입 실패");
    } finally {
      setSeeding(false);
    }
  }

  async function handleBackfill() {
    setBackfilling(true);
    try {
      const res = await fetch("/api/admin/backfill-draws", { method: "POST" });
      const data = await res.json();
      alert(`${data.message}`);
      fetchDraws();
    } catch {
      alert("백필 실패");
    } finally {
      setBackfilling(false);
    }
  }

  function formatMoney(amount: number | null): string {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">당첨 결과</h1>
        <div className="flex gap-2">
          <Button onClick={handleSeed} disabled={seeding} variant="outline" size="sm">
            {seeding ? "삽입 중..." : "샘플 데이터"}
          </Button>
          <Button onClick={handleBackfill} disabled={backfilling} variant="outline" size="sm">
            {backfilling ? "수집 중..." : "전체 수집"}
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
            <p>당첨 데이터가 없습니다.</p>
            <p className="text-sm mt-2">&quot;데이터 수집&quot; 버튼을 눌러 동행복권에서 데이터를 가져오세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {draws.map((draw) => (
            <Card key={draw.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>제 {draw.draw_no}회</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {draw.draw_date}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <LottoBallSet
                    numbers={[draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6]}
                    bonusNumber={draw.bonus_num}
                  />
                  <div className="text-right text-sm text-muted-foreground">
                    <div>1등 {formatMoney(draw.first_prize)}</div>
                    {draw.first_winners !== null && (
                      <div>{draw.first_winners}명</div>
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
