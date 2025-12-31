-- 002_create_game_sessions.sql
-- 遊戲局數表（防作弊核心）

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT CHECK (LENGTH(nickname) <= 12),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'expired')),
  max_questions INT DEFAULT 20,
  time_limit_sec INT DEFAULT 15,
  seed TEXT NOT NULL,
  questions JSONB NOT NULL,
  current_index INT DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  total_score INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  total_time_ms INT DEFAULT 0,
  submit_token TEXT NOT NULL,
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_sessions_status ON game_sessions (status);
CREATE INDEX idx_sessions_expires ON game_sessions (expires_at) WHERE status = 'active';

-- RLS (僅 service role 可存取)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
-- 無公開 policy，由 server 端使用 service role 操作

COMMENT ON TABLE game_sessions IS '遊戲局數，每局題序與選項固定化';
COMMENT ON COLUMN game_sessions.questions IS '題目資料 JSONB [{q, song_id, options, correct_index}]';
COMMENT ON COLUMN game_sessions.submit_token IS '提交 Token，防重複提交';
