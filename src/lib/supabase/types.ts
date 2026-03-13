export interface Database {
  public: {
    Tables: {
      draw_results: {
        Row: DrawResult;
        Insert: Omit<DrawResult, "id" | "created_at">;
        Update: Partial<Omit<DrawResult, "id">>;
      };
      recipients: {
        Row: Recipient;
        Insert: Omit<Recipient, "id" | "created_at">;
        Update: Partial<Omit<Recipient, "id">>;
      };
      algorithms: {
        Row: Algorithm;
        Insert: Omit<Algorithm, "id" | "created_at">;
        Update: Partial<Omit<Algorithm, "id">>;
      };
      recommendations: {
        Row: Recommendation;
        Insert: Omit<Recommendation, "id" | "created_at">;
        Update: Partial<Omit<Recommendation, "id">>;
      };
      match_results: {
        Row: MatchResult;
        Insert: Omit<MatchResult, "id" | "created_at">;
        Update: Partial<Omit<MatchResult, "id">>;
      };
    };
  };
}

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
