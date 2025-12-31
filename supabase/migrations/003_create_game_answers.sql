-- 003_create_game_answers.sql
-- 作答紀錄表

CREATE TABLE IF NOT EXISTS game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_index INT NOT NULL CHECK (question_index >= 0 AND question_index < 20),
  chosen_index INT NOT NULL CHECK (chosen_index >= -1 AND chosen_index <= 3), -- -1 表示超時
  is_correct BOOLEAN NOT NULL,
  answer_time_ms INT NOT NULL CHECK (answer_time_ms >= 0),
  score INT NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (session_id, question_index)
);

-- 索引
CREATE INDEX idx_answers_session ON game_answers (session_id);

-- RLS (僅 service role 可存取)
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;
-- 無公開 policy，由 server 端使用 service role 操作

COMMENT ON TABLE game_answers IS '逐題作答紀錄';
COMMENT ON COLUMN game_answers.chosen_index IS '選擇的選項，-1 表示超時未作答';
COMMENT ON COLUMN game_answers.answer_time_ms IS '答題時間（毫秒）';
