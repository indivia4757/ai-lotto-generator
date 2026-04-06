import { NextResponse } from "next/server";
import db from "@/lib/db";

const SEED_DATA = [
  { draw_no: 1, draw_date: "2002-12-07", num1: 10, num2: 23, num3: 29, num4: 33, num5: 37, num6: 40, bonus_num: 16, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 100, draw_date: "2004-11-13", num1: 4, num2: 7, num3: 12, num4: 14, num5: 22, num6: 38, bonus_num: 43, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 200, draw_date: "2006-10-14", num1: 3, num2: 13, num3: 19, num4: 32, num5: 38, num6: 44, bonus_num: 15, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 300, draw_date: "2008-09-13", num1: 1, num2: 4, num3: 8, num4: 14, num5: 27, num6: 39, bonus_num: 45, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 400, draw_date: "2010-08-14", num1: 3, num2: 17, num3: 19, num4: 30, num5: 36, num6: 44, bonus_num: 14, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 500, draw_date: "2012-07-14", num1: 6, num2: 14, num3: 16, num4: 21, num5: 27, num6: 35, bonus_num: 1, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 600, draw_date: "2014-06-14", num1: 2, num2: 8, num3: 19, num4: 32, num5: 37, num6: 45, bonus_num: 20, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 700, draw_date: "2016-05-14", num1: 1, num2: 5, num3: 14, num4: 28, num5: 31, num6: 40, bonus_num: 44, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 800, draw_date: "2018-04-14", num1: 2, num2: 10, num3: 13, num4: 24, num5: 27, num6: 37, bonus_num: 6, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 900, draw_date: "2020-03-14", num1: 7, num2: 11, num3: 14, num4: 22, num5: 26, num6: 40, bonus_num: 33, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1000, draw_date: "2022-02-12", num1: 2, num2: 5, num3: 15, num4: 24, num5: 29, num6: 45, bonus_num: 21, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1050, draw_date: "2023-01-14", num1: 5, num2: 12, num3: 25, num4: 26, num5: 38, num6: 45, bonus_num: 41, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1100, draw_date: "2023-12-30", num1: 3, num2: 10, num3: 11, num4: 28, num5: 39, num6: 43, bonus_num: 7, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1110, draw_date: "2024-03-09", num1: 10, num2: 14, num3: 20, num4: 32, num5: 37, num6: 45, bonus_num: 6, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1120, draw_date: "2024-05-18", num1: 3, num2: 11, num3: 15, num4: 27, num5: 38, num6: 44, bonus_num: 31, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1130, draw_date: "2024-07-27", num1: 6, num2: 11, num3: 22, num4: 28, num5: 33, num6: 42, bonus_num: 12, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1140, draw_date: "2024-10-05", num1: 3, num2: 7, num3: 18, num4: 24, num5: 36, num6: 39, bonus_num: 16, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1145, draw_date: "2024-11-09", num1: 1, num2: 5, num3: 21, num4: 24, num5: 31, num6: 37, bonus_num: 17, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1150, draw_date: "2024-12-14", num1: 4, num2: 9, num3: 17, num4: 28, num5: 35, num6: 40, bonus_num: 22, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1155, draw_date: "2025-01-18", num1: 8, num2: 16, num3: 19, num4: 25, num5: 38, num6: 43, bonus_num: 30, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1156, draw_date: "2025-01-25", num1: 2, num2: 12, num3: 17, num4: 24, num5: 30, num6: 44, bonus_num: 1, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1157, draw_date: "2025-02-01", num1: 5, num2: 14, num3: 22, num4: 31, num5: 33, num6: 42, bonus_num: 8, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1158, draw_date: "2025-02-08", num1: 3, num2: 9, num3: 15, num4: 26, num5: 37, num6: 45, bonus_num: 19, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1159, draw_date: "2025-02-15", num1: 7, num2: 13, num3: 20, num4: 29, num5: 34, num6: 41, bonus_num: 11, total_sales: 0, first_prize: 0, first_winners: 0 },
  { draw_no: 1160, draw_date: "2025-02-22", num1: 1, num2: 10, num3: 18, num4: 27, num5: 36, num6: 43, bonus_num: 5, total_sales: 0, first_prize: 0, first_winners: 0 },
];

export async function POST() {
  const insert = db.prepare(
    `INSERT OR REPLACE INTO draw_results
     (draw_no, draw_date, num1, num2, num3, num4, num5, num6, bonus_num, total_sales, first_prize, first_winners)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seed = db.transaction(() => {
    for (const row of SEED_DATA) {
      insert.run(
        row.draw_no, row.draw_date,
        row.num1, row.num2, row.num3, row.num4, row.num5, row.num6,
        row.bonus_num, row.total_sales, row.first_prize, row.first_winners
      );
    }
  });
  seed();

  return NextResponse.json({
    message: `시드 데이터 삽입 완료: ${SEED_DATA.length}건`,
    inserted: SEED_DATA.length,
  });
}
