-- 001_create_songs.sql
-- Jay Guess 題庫表

CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_zh TEXT NOT NULL,
  album TEXT,
  year INT,
  youtube_video_id TEXT NOT NULL UNIQUE,
  start_sec INT DEFAULT 0,
  duration_sec INT,
  difficulty INT DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_songs_active ON songs (is_active) WHERE is_active = true;
CREATE INDEX idx_songs_youtube ON songs (youtube_video_id);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "songs_select" ON songs FOR SELECT USING (true);

COMMENT ON TABLE songs IS '周杰倫歌曲題庫';
COMMENT ON COLUMN songs.title_zh IS '歌曲中文名稱';
COMMENT ON COLUMN songs.youtube_video_id IS 'YouTube 影片 ID';
COMMENT ON COLUMN songs.start_sec IS '開始播放秒數';
COMMENT ON COLUMN songs.difficulty IS '難度等級 1-3';
