import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "lotto.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 10000");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS draw_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_no INTEGER NOT NULL UNIQUE,
      draw_date TEXT NOT NULL,
      num1 INTEGER NOT NULL,
      num2 INTEGER NOT NULL,
      num3 INTEGER NOT NULL,
      num4 INTEGER NOT NULL,
      num5 INTEGER NOT NULL,
      num6 INTEGER NOT NULL,
      bonus_num INTEGER NOT NULL,
      total_sales INTEGER,
      first_prize INTEGER,
      first_winners INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nickname TEXT,
      contact TEXT,
      memo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS algorithms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'analysis',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER REFERENCES recipients(id) ON DELETE SET NULL,
      algorithm_id INTEGER NOT NULL REFERENCES algorithms(id),
      algorithm_slug TEXT NOT NULL,
      numbers TEXT NOT NULL,
      target_draw_no INTEGER NOT NULL,
      memo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS match_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
      draw_no INTEGER NOT NULL,
      matched_numbers TEXT NOT NULL DEFAULT '[]',
      matched_bonus INTEGER NOT NULL DEFAULT 0,
      rank INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(recommendation_id, draw_no)
    );

    CREATE TABLE IF NOT EXISTS generation_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_draw_no INTEGER NOT NULL,
      algorithm_slug TEXT NOT NULL,
      total_sets INTEGER NOT NULL,
      memo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS winning_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_no INTEGER NOT NULL UNIQUE,
      total_recommendations INTEGER NOT NULL DEFAULT 0,
      rank1_count INTEGER NOT NULL DEFAULT 0,
      rank2_count INTEGER NOT NULL DEFAULT 0,
      rank3_count INTEGER NOT NULL DEFAULT 0,
      rank4_count INTEGER NOT NULL DEFAULT 0,
      rank5_count INTEGER NOT NULL DEFAULT 0,
      none_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER REFERENCES recipients(id) ON DELETE SET NULL,
      recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
      match_result_id INTEGER NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
      draw_no INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      prize_amount INTEGER,
      claimed INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_draw_results_draw_no ON draw_results(draw_no DESC);
    CREATE INDEX IF NOT EXISTS idx_recommendations_target ON recommendations(target_draw_no);
    CREATE INDEX IF NOT EXISTS idx_recommendations_recipient ON recommendations(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_match_results_draw ON match_results(draw_no);
    CREATE INDEX IF NOT EXISTS idx_generation_sessions_draw ON generation_sessions(target_draw_no);
    CREATE INDEX IF NOT EXISTS idx_winners_draw ON winners(draw_no);
    CREATE INDEX IF NOT EXISTS idx_winners_recipient ON winners(recipient_id);
  `);

  // Seed algorithms if empty
  const algCount = db.prepare("SELECT COUNT(*) as c FROM algorithms").get() as {
    c: number;
  };
  if (algCount.c === 0) {
    const insert = db.prepare(
      "INSERT INTO algorithms (slug, name, description, category) VALUES (?, ?, ?, ?)"
    );
    const seed = db.transaction(() => {
      insert.run("frequency", "빈도 분석", "최근 회차 데이터에서 핫/콜드 넘버를 분석하여 가중 확률로 번호를 선택합니다.", "analysis");
      insert.run("neglected", "소외 번호", "최근 N회차 동안 출현하지 않은 소외 번호를 우선 선택합니다.", "analysis");
      insert.run("balanced", "균형 조합", "홀짝, 고저, 구간별 균형을 맞춘 조합을 생성합니다.", "pattern");
      insert.run("consecutive", "연번 패턴", "실제 당첨 통계의 연속번호 출현 확률을 반영하여 번호를 생성합니다.", "pattern");
      insert.run("sum-range", "합계 범위", "역대 당첨번호 합계 분포(100~200)에 맞추어 번호를 생성합니다.", "pattern");
      insert.run("hybrid", "AI 하이브리드", "빈도(30%)+패턴(30%)+구간(20%)+소외(20%) 앙상블로 최적 조합을 도출합니다.", "ai");
      insert.run("delta", "델타 시스템", "번호 간 차이(델타) 분포를 역산하여 번호를 생성합니다.", "system");
      insert.run("random", "완전 랜덤", "crypto.getRandomValues 기반 순수 랜덤 번호를 생성합니다.", "random");
    });
    seed();
  }

  _db = db;
  return db;
}

// Proxy that lazily initializes the DB on first use
const db = new Proxy({} as Database.Database, {
  get(_target, prop: string | symbol) {
    const instance = getDb();
    const value = instance[prop as keyof Database.Database];
    if (typeof value === "function") {
      return (value as Function).bind(instance);
    }
    return value;
  },
});

export default db;
