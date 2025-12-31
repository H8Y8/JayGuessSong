-- 004_create_leaderboard_entries.sql
-- 排行榜表

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES game_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '匿名玩家',
  total_score INT NOT NULL,
  correct_count INT NOT NULL,
  total_time_ms INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 排名索引（tie-breakers: 分數降序、時間升序、時間降序）
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries (
  total_score DESC,
  total_time_ms ASC,
  created_at DESC
);

CREATE INDEX idx_leaderboard_session ON leaderboard_entries (session_id);

-- RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_select" ON leaderboard_entries FOR SELECT USING (true);

COMMENT ON TABLE leaderboard_entries IS '排行榜摘要';
COMMENT ON COLUMN leaderboard_entries.total_score IS '總分';
COMMENT ON COLUMN leaderboard_entries.total_time_ms IS '總答題時間（毫秒）';
