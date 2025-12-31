-- 005_fix_chosen_index_constraint.sql
-- 修復 chosen_index 的 CHECK 約束，允許 -1 表示超時

-- 刪除舊的約束（如果存在）
ALTER TABLE game_answers DROP CONSTRAINT IF EXISTS game_answers_chosen_index_check;

-- 添加新的約束，允許 -1 (超時) 到 3
ALTER TABLE game_answers ADD CONSTRAINT game_answers_chosen_index_check 
  CHECK (chosen_index >= -1 AND chosen_index <= 3);
