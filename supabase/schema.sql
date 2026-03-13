-- 회차별 당첨번호
CREATE TABLE draw_results (
  id BIGSERIAL PRIMARY KEY,
  draw_no INTEGER NOT NULL UNIQUE,
  draw_date DATE NOT NULL,
  num1 SMALLINT NOT NULL,
  num2 SMALLINT NOT NULL,
  num3 SMALLINT NOT NULL,
  num4 SMALLINT NOT NULL,
  num5 SMALLINT NOT NULL,
  num6 SMALLINT NOT NULL,
  bonus_num SMALLINT NOT NULL,
  total_sales BIGINT,
  first_prize BIGINT,
  first_winners INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 대상자
CREATE TABLE recipients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  nickname VARCHAR(50),
  contact VARCHAR(100),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알고리즘 정의
CREATE TABLE algorithms (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'analysis',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 기록
CREATE TABLE recommendations (
  id BIGSERIAL PRIMARY KEY,
  recipient_id BIGINT REFERENCES recipients(id) ON DELETE SET NULL,
  algorithm_id BIGINT NOT NULL REFERENCES algorithms(id),
  algorithm_slug VARCHAR(50) NOT NULL,
  numbers SMALLINT[] NOT NULL,
  target_draw_no INTEGER NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 당첨 매칭 결과
CREATE TABLE match_results (
  id BIGSERIAL PRIMARY KEY,
  recommendation_id BIGINT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  draw_no INTEGER NOT NULL,
  matched_numbers SMALLINT[] NOT NULL DEFAULT '{}',
  matched_bonus BOOLEAN NOT NULL DEFAULT FALSE,
  rank SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id, draw_no)
);

-- 인덱스
CREATE INDEX idx_draw_results_draw_no ON draw_results(draw_no DESC);
CREATE INDEX idx_recommendations_target ON recommendations(target_draw_no);
CREATE INDEX idx_recommendations_recipient ON recommendations(recipient_id);
CREATE INDEX idx_match_results_draw ON match_results(draw_no);

-- 알고리즘 시드 데이터
INSERT INTO algorithms (slug, name, description, category) VALUES
  ('frequency', '빈도 분석', '최근 회차 데이터에서 핫/콜드 넘버를 분석하여 가중 확률로 번호를 선택합니다.', 'analysis'),
  ('neglected', '소외 번호', '최근 N회차 동안 출현하지 않은 소외 번호를 우선 선택합니다.', 'analysis'),
  ('balanced', '균형 조합', '홀짝, 고저, 구간별 균형을 맞춘 조합을 생성합니다.', 'pattern'),
  ('consecutive', '연번 패턴', '실제 당첨 통계의 연속번호 출현 확률을 반영하여 번호를 생성합니다.', 'pattern'),
  ('sum-range', '합계 범위', '역대 당첨번호 합계 분포(100~200)에 맞추어 번호를 생성합니다.', 'pattern'),
  ('hybrid', 'AI 하이브리드', '빈도(30%)+패턴(30%)+구간(20%)+소외(20%) 앙상블로 최적 조합을 도출합니다.', 'ai'),
  ('delta', '델타 시스템', '번호 간 차이(델타) 분포를 역산하여 번호를 생성합니다.', 'system'),
  ('random', '완전 랜덤', 'crypto.getRandomValues 기반 순수 랜덤 번호를 생성합니다.', 'random');
