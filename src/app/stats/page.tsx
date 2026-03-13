"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#6b7280", "#22c55e", "#8b5cf6", "#ec4899"];

interface FrequencyItem {
  number: number;
  count: number;
  percentage: number;
}

interface HotColdData {
  hot: { number: number; count: number }[];
  cold: { number: number; count: number }[];
  recentDraws: number;
}

export default function StatsPage() {
  const [freqData, setFreqData] = useState<FrequencyItem[]>([]);
  const [hotCold, setHotCold] = useState<HotColdData | null>(null);
  const [oddEven, setOddEven] = useState<Record<string, number>>({});
  const [sectionData, setSectionData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [freqRes, hcRes, oeRes, secRes] = await Promise.all([
        fetch("/api/stats?type=frequency"),
        fetch("/api/stats?type=hot-cold"),
        fetch("/api/stats?type=odd-even"),
        fetch("/api/stats?type=section"),
      ]);
      const [freq, hc, oe, sec] = await Promise.all([
        freqRes.json(),
        hcRes.json(),
        oeRes.json(),
        secRes.json(),
      ]);
      setFreqData(freq.data || []);
      setHotCold(hc);
      setOddEven(oe.distribution || {});
      setSectionData(sec.sections || {});
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">통계 분석</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const oddEvenChartData = Object.entries(oddEven).map(([key, value]) => ({
    name: `홀${key}`,
    value,
  }));

  const sectionChartData = Object.entries(sectionData).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">통계 분석</h1>

      {freqData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            통계 데이터가 없습니다. 먼저 당첨 결과 데이터를 수집하세요.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="frequency">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="frequency">번호별 빈도</TabsTrigger>
            <TabsTrigger value="hot-cold">핫/콜드</TabsTrigger>
            <TabsTrigger value="odd-even">홀짝 분포</TabsTrigger>
            <TabsTrigger value="section">구간별</TabsTrigger>
          </TabsList>

          <TabsContent value="frequency">
            <Card>
              <CardHeader>
                <CardTitle>번호별 출현 빈도</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={freqData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="number" fontSize={10} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hot-cold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-500">🔥 핫 넘버 (최근 {hotCold?.recentDraws}회)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hotCold?.hot.map((item) => (
                      <div key={item.number} className="flex items-center justify-between">
                        <span className="font-mono text-lg">{item.number}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 bg-red-400 rounded"
                            style={{ width: `${item.count * 20}px` }}
                          />
                          <span className="text-sm text-muted-foreground w-8 text-right">{item.count}회</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-500">❄️ 콜드 넘버</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hotCold?.cold.map((item) => (
                      <div key={item.number} className="flex items-center justify-between">
                        <span className="font-mono text-lg">{item.number}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 bg-blue-400 rounded"
                            style={{ width: `${item.count * 20}px` }}
                          />
                          <span className="text-sm text-muted-foreground w-8 text-right">{item.count}회</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="odd-even">
            <Card>
              <CardHeader>
                <CardTitle>홀짝 비율 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={oddEvenChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={140}
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      >
                        {oddEvenChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="section">
            <Card>
              <CardHeader>
                <CardTitle>구간별 출현 횟수</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {sectionChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
