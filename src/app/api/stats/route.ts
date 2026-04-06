import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { DrawResult } from "@/lib/db/types";

function getNumbers(d: DrawResult): number[] {
  return [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "frequency";
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

  const draws = db
    .prepare("SELECT * FROM draw_results ORDER BY draw_no DESC LIMIT ?")
    .all(limit) as DrawResult[];

  if (draws.length === 0) {
    return NextResponse.json({ data: [], type });
  }

  switch (type) {
    case "frequency": {
      const freq: Record<number, number> = {};
      for (let i = 1; i <= 45; i++) freq[i] = 0;
      for (const d of draws) {
        for (const n of getNumbers(d)) freq[n]++;
      }
      const data = Object.entries(freq).map(([num, count]) => ({
        number: Number(num),
        count,
        percentage: Math.round((count / (draws.length * 6)) * 10000) / 100,
      }));
      return NextResponse.json({ data, type, totalDraws: draws.length });
    }

    case "hot-cold": {
      const recentN = Math.min(draws.length, 20);
      const recent = draws.slice(0, recentN);
      const freq: Record<number, number> = {};
      for (let i = 1; i <= 45; i++) freq[i] = 0;
      for (const d of recent) {
        for (const n of getNumbers(d)) freq[n]++;
      }
      const sorted = Object.entries(freq)
        .map(([num, count]) => ({ number: Number(num), count }))
        .sort((a, b) => b.count - a.count);
      return NextResponse.json({
        hot: sorted.slice(0, 10),
        cold: sorted.slice(-10).reverse(),
        type,
        recentDraws: recentN,
      });
    }

    case "sum-distribution": {
      const sums = draws.map((d) => ({
        drawNo: d.draw_no,
        sum: getNumbers(d).reduce((a, b) => a + b, 0),
      }));
      const ranges: Record<string, number> = {};
      for (const { sum } of sums) {
        const range = `${Math.floor(sum / 20) * 20}-${Math.floor(sum / 20) * 20 + 19}`;
        ranges[range] = (ranges[range] || 0) + 1;
      }
      return NextResponse.json({ distribution: ranges, sums, type });
    }

    case "odd-even": {
      const distribution = draws.map((d) => {
        const nums = getNumbers(d);
        const odd = nums.filter((n) => n % 2 === 1).length;
        return { drawNo: d.draw_no, odd, even: 6 - odd };
      });
      const summary: Record<string, number> = {};
      for (const { odd, even } of distribution) {
        const key = `${odd}:${even}`;
        summary[key] = (summary[key] || 0) + 1;
      }
      return NextResponse.json({ distribution: summary, type });
    }

    case "section": {
      const sections: Record<string, number> = {
        "1-10": 0, "11-20": 0, "21-30": 0, "31-40": 0, "41-45": 0,
      };
      for (const d of draws) {
        for (const n of getNumbers(d)) {
          if (n <= 10) sections["1-10"]++;
          else if (n <= 20) sections["11-20"]++;
          else if (n <= 30) sections["21-30"]++;
          else if (n <= 40) sections["31-40"]++;
          else sections["41-45"]++;
        }
      }
      return NextResponse.json({ sections, type, totalDraws: draws.length });
    }

    default:
      return NextResponse.json({ error: "Unknown stat type" }, { status: 400 });
  }
}
