import { createAdminClient } from '@/lib/supabase/server';
import { QuestionItem, SongWithTitle } from '@/types/database';
import { randomBytes } from 'crypto';

// 配置
const QUESTION_COUNT = 20;
const OPTIONS_PER_QUESTION = 4;

/**
 * 生成遊戲題目
 * @returns 20 題的題目列表和 seed
 */
export async function generateQuestions(): Promise<{
    questions: QuestionItem[];
    seed: string;
}> {
    const supabase = createAdminClient();

    // 獲取所有啟用的歌曲
    const { data: songs, error } = await supabase
        .from('songs')
        .select('id, title_zh, youtube_video_id, start_sec')
        .eq('is_active', true);

    if (error || !songs) {
        throw new Error('無法載入題庫');
    }

    if (songs.length < QUESTION_COUNT) {
        throw new Error(`題庫不足，需要至少 ${QUESTION_COUNT} 首歌，目前只有 ${songs.length} 首`);
    }

    // 生成隨機種子
    const seed = randomBytes(16).toString('hex');

    // 隨機選擇答案歌曲
    const shuffledSongs = shuffleArray([...songs], seed);
    const answerSongs = shuffledSongs.slice(0, QUESTION_COUNT);

    // 剩餘歌曲作為干擾選項池
    const distractorPool = shuffledSongs.slice(QUESTION_COUNT);

    // 生成每題的選項
    const questions: QuestionItem[] = answerSongs.map((answer, index) => {
        // 隨機選擇 3 個干擾選項
        const distractors = selectRandomDistractors(distractorPool, 3, seed + index);

        // 合併答案和干擾選項
        const allOptions = [answer, ...distractors];

        // 隨機排列選項
        const shuffledOptions = shuffleArray(allOptions, seed + 'opt' + index);

        // 找出正確答案的位置
        const correctIndex = shuffledOptions.findIndex(opt => opt.id === answer.id);

        return {
            q: index,
            song_id: answer.id,
            options: shuffledOptions.map(opt => opt.id),
            correct_index: correctIndex,
        };
    });

    return { questions, seed };
}

/**
 * 根據題目獲取顯示資料
 */
export async function getQuestionDisplay(
    questionItem: QuestionItem,
    songs: Map<string, SongWithTitle>
): Promise<{
    youtube: { videoId: string; startSec: number };
    options: string[];
}> {
    const answerSong = songs.get(questionItem.song_id);
    if (!answerSong) {
        throw new Error('找不到答案歌曲');
    }

    const optionTitles = questionItem.options.map(id => {
        const song = songs.get(id);
        return song?.title_zh || '未知歌曲';
    });

    return {
        youtube: {
            videoId: answerSong.youtube_video_id,
            startSec: answerSong.start_sec,
        },
        options: optionTitles,
    };
}

// 歌曲快取
let songsCache: Map<string, SongWithTitle> | null = null;
let songsCacheTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分鐘

/**
 * 載入歌曲 Map（用於快速查詢，帶快取）
 */
export async function loadSongsMap(): Promise<Map<string, SongWithTitle>> {
    const now = Date.now();

    // 如果快取有效，直接返回
    if (songsCache && (now - songsCacheTime) < CACHE_TTL_MS) {
        return songsCache;
    }

    const supabase = createAdminClient();

    const { data: songs, error } = await supabase
        .from('songs')
        .select('id, title_zh, youtube_video_id, start_sec')
        .eq('is_active', true);

    if (error || !songs) {
        throw new Error('無法載入題庫');
    }

    songsCache = new Map(songs.map(song => [song.id, song]));
    songsCacheTime = now;

    return songsCache;
}

// ============ Helper Functions ============

/**
 * Fisher-Yates 洗牌算法（帶種子）
 */
function shuffleArray<T>(array: T[], seed: string): T[] {
    const result = [...array];
    let random = seededRandom(seed);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

/**
 * 從池中選擇 n 個隨機元素
 */
function selectRandomDistractors<T>(pool: T[], count: number, seed: string): T[] {
    const shuffled = shuffleArray(pool, seed);
    return shuffled.slice(0, count);
}

/**
 * 種子隨機數產生器 (簡單的 LCG)
 */
function seededRandom(seed: string): () => number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    let state = hash;

    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}
