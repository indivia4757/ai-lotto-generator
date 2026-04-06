export interface DrawResult {
  id: number;
  draw_no: number;
  draw_date: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
  total_sales: number | null;
  first_prize: number | null;
  first_winners: number | null;
  created_at: string;
}

export interface Recipient {
  id: number;
  name: string;
  nickname: string | null;
  contact: string | null;
  memo: string | null;
  created_at: string;
}

export interface Algorithm {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

export interface Recommendation {
  id: number;
  recipient_id: number | null;
  algorithm_id: number;
  algorithm_slug: string;
  numbers: number[];
  target_draw_no: number;
  memo: string | null;
  created_at: string;
  recipient?: Recipient;
  algorithm?: Algorithm;
}

export interface MatchResult {
  id: number;
  recommendation_id: number;
  draw_no: number;
  matched_numbers: number[];
  matched_bonus: boolean;
  rank: number | null;
  created_at: string;
  recommendation?: Recommendation;
}

export interface GenerationSession {
  id: number;
  target_draw_no: number;
  algorithm_slug: string;
  total_sets: number;
  memo: string | null;
  created_at: string;
}

export interface WinningHistory {
  id: number;
  draw_no: number;
  total_recommendations: number;
  rank1_count: number;
  rank2_count: number;
  rank3_count: number;
  rank4_count: number;
  rank5_count: number;
  none_count: number;
  created_at: string;
}

export interface Winner {
  id: number;
  recipient_id: number | null;
  recommendation_id: number;
  match_result_id: number;
  draw_no: number;
  rank: number;
  prize_amount: number | null;
  claimed: boolean;
  memo: string | null;
  created_at: string;
  recipient?: Recipient;
  recommendation?: Recommendation;
}
