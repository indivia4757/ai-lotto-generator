"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LottoBallSet } from "@/components/lotto/lotto-ball";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recommendation } from "@/lib/db/types";

function getRankBadge(rank: number | null | undefined) {
  if (!rank) return null;
  const colors: Record<number, string> = {
    1: "bg-yellow-500 text-white",
    2: "bg-gray-400 text-white",
    3: "bg-orange-600 text-white",
    4: "bg-blue-500 text-white",
    5: "bg-green-500 text-white",
  };
  return (
    <Badge className={colors[rank] || ""}>
      {rank}등
    </Badge>
  );
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations?limit=100");
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">추천 기록</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            추천 기록이 없습니다. 번호 생성 페이지에서 번호를 저장하세요.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{rec.algorithm_slug}</Badge>
                  <span className="text-muted-foreground">→ 제{rec.target_draw_no}회</span>
                  {rec.recipient && (
                    <span className="text-muted-foreground">
                      | {rec.recipient.name}
                    </span>
                  )}
                  {getRankBadge(undefined)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <LottoBallSet numbers={rec.numbers} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(rec.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
