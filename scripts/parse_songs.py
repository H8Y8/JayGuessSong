#!/usr/bin/env python3
"""
解析 songs.csv 並轉換成 Supabase seed.sql 格式
根據 PRD songs 表結構：
- id: uuid (自動生成)
- title_zh: 歌曲中文名稱
- album: 專輯名稱 (nullable)
- year: 發行年份 (nullable)
- youtube_video_id: YouTube 影片 ID
- start_sec: 起始秒數 (default: 0)
- duration_sec: 播放時長 (nullable)
- difficulty: 難度等級 1-3 (default: 1)
- is_active: 是否啟用 (default: true)
"""

import csv
import re
import json
from urllib.parse import urlparse, parse_qs
from pathlib import Path


def extract_youtube_video_id(url: str) -> str | None:
    """從 YouTube URL 提取 video ID"""
    try:
        parsed = urlparse(url)
        if parsed.hostname in ('www.youtube.com', 'youtube.com'):
            query = parse_qs(parsed.query)
            return query.get('v', [None])[0]
        elif parsed.hostname == 'youtu.be':
            return parsed.path[1:]
    except Exception:
        pass
    return None


def extract_title_zh(raw_title: str) -> str:
    """
    從原始標題提取中文歌名
    格式: 周杰倫 Jay Chou【歌名 English Name】Official MV
    """
    # 匹配【】中的內容
    match = re.search(r'【(.+?)】', raw_title)
    if match:
        full_name = match.group(1)
        # 嘗試只取中文部分（空格前）
        parts = full_name.split(' ')
        if parts:
            # 過濾掉 feat. 等標記
            zh_name = parts[0]
            # 移除可能的標點
            zh_name = zh_name.strip()
            return zh_name
    return raw_title


def parse_songs_csv(csv_path: str) -> list[dict]:
    """解析 CSV 並返回歌曲列表"""
    songs = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        # 移除 BOM 並處理換行符
        content = f.read().replace('\r\n', '\n').replace('\r', '\n')
        
    # 重新解析
    lines = content.strip().split('\n')
    reader = csv.DictReader(lines)
    
    for row in reader:
        raw_title = row.get('title', '').strip()
        url = row.get('url', '').strip()
        
        if not raw_title or not url:
            continue
            
        # 提取 YouTube video ID
        video_id = extract_youtube_video_id(url)
        if not video_id:
            print(f"⚠️  無法提取 video ID: {url}")
            continue
            
        # 提取中文歌名
        title_zh = extract_title_zh(raw_title)
        
        # 清理歌名中的特殊字符
        title_zh = title_zh.replace('"', '').replace("'", "''")
        
        songs.append({
            'title_zh': title_zh,
            'youtube_video_id': video_id,
            'start_sec': 0,
            'difficulty': 1,
            'is_active': True
        })
    
    return songs


def generate_seed_sql(songs: list[dict], output_path: str):
    """生成 Supabase seed.sql"""
    
    sql_lines = [
        "-- Jay Guess 題庫種子資料",
        f"-- 生成時間: 2025-12-30",
        f"-- 總歌曲數: {len(songs)}",
        "",
        "-- 清空現有資料 (可選)",
        "-- TRUNCATE TABLE songs RESTART IDENTITY CASCADE;",
        "",
        "INSERT INTO songs (title_zh, youtube_video_id, start_sec, difficulty, is_active)",
        "VALUES"
    ]
    
    values = []
    for song in songs:
        value = f"  ('{song['title_zh']}', '{song['youtube_video_id']}', {song['start_sec']}, {song['difficulty']}, {str(song['is_active']).lower()})"
        values.append(value)
    
    sql_lines.append(',\n'.join(values) + ';')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ 已生成 SQL: {output_path}")


def generate_json(songs: list[dict], output_path: str):
    """生成 JSON 格式（方便除錯和預覽）"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已生成 JSON: {output_path}")


def main():
    base_dir = Path(__file__).parent.parent  # 上層目錄 (JayGuessSong/)
    csv_path = base_dir / 'songs.csv'
    
    if not csv_path.exists():
        print(f"❌ 找不到 {csv_path}")
        return
    
    print(f"📂 讀取 {csv_path}")
    songs = parse_songs_csv(str(csv_path))
    
    print(f"🎵 解析到 {len(songs)} 首歌曲")
    
    # 檢查重複的 video ID
    video_ids = [s['youtube_video_id'] for s in songs]
    duplicates = set([vid for vid in video_ids if video_ids.count(vid) > 1])
    if duplicates:
        print(f"⚠️  發現重複的 video ID: {duplicates}")
        # 移除重複
        seen = set()
        unique_songs = []
        for song in songs:
            if song['youtube_video_id'] not in seen:
                seen.add(song['youtube_video_id'])
                unique_songs.append(song)
        songs = unique_songs
        print(f"🔄 移除重複後剩餘 {len(songs)} 首歌曲")
    
    # 生成輸出檔案
    supabase_dir = base_dir / 'supabase'
    supabase_dir.mkdir(exist_ok=True)
    
    generate_seed_sql(songs, str(supabase_dir / 'seed.sql'))
    generate_json(songs, str(base_dir / 'songs_parsed.json'))
    
    # 顯示前 5 首歌曲預覽
    print("\n📋 前 5 首歌曲預覽:")
    for i, song in enumerate(songs[:5], 1):
        print(f"  {i}. {song['title_zh']} (ID: {song['youtube_video_id']})")
    
    print(f"\n✅ 完成！共 {len(songs)} 首歌曲")


if __name__ == '__main__':
    main()
