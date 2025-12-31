/**
 * 計分模組
 * 公式: score = round(Smax × (1 - t/T)^p)
 * - Smax = 100 (最高分)
 * - T = 15 秒 (時間限制)
 * - p = 1.7 (衰減指數)
 */

// 配置常數
export const SCORING_CONFIG = {
    MAX_SCORE: 100,          // Smax
    TIME_LIMIT_MS: 15000,    // T (15秒)
    DECAY_POWER: 1.7,        // p
    GRACE_MS: 500,           // 網路延遲容錯
};

/**
 * 計算答題分數
 * @param answerTimeMs 答題時間（毫秒）
 * @param isCorrect 是否答對
 * @returns 得分 (0-100)
 */
export function calculateScore(answerTimeMs: number, isCorrect: boolean): number {
    // 答錯直接 0 分
    if (!isCorrect) {
        return 0;
    }

    const { MAX_SCORE, TIME_LIMIT_MS, DECAY_POWER, GRACE_MS } = SCORING_CONFIG;

    // 超時（含容錯）直接 0 分
    if (answerTimeMs > TIME_LIMIT_MS + GRACE_MS) {
        return 0;
    }

    // 超時但在容錯範圍內，以時限計算
    const effectiveTime = Math.min(answerTimeMs, TIME_LIMIT_MS);

    // 負數時間（作弊？）視為 0
    if (effectiveTime < 0) {
        return 0;
    }

    // 套用公式
    const t = effectiveTime / 1000; // 轉為秒
    const T = TIME_LIMIT_MS / 1000;
    const score = MAX_SCORE * Math.pow(1 - t / T, DECAY_POWER);

    return Math.round(Math.max(0, score));
}

/**
 * 計算預估分數（用於前端顯示）
 */
export function estimateScore(remainingTimeMs: number): number {
    const { MAX_SCORE, TIME_LIMIT_MS, DECAY_POWER } = SCORING_CONFIG;
    const elapsedMs = TIME_LIMIT_MS - remainingTimeMs;

    if (elapsedMs < 0) return MAX_SCORE;
    if (elapsedMs >= TIME_LIMIT_MS) return 0;

    const t = elapsedMs / 1000;
    const T = TIME_LIMIT_MS / 1000;
    const score = MAX_SCORE * Math.pow(1 - t / T, DECAY_POWER);

    return Math.round(Math.max(0, score));
}

/**
 * 分數分級
 */
export function getScoreGrade(score: number): 'perfect' | 'great' | 'good' | 'ok' | 'miss' {
    if (score >= 90) return 'perfect';
    if (score >= 70) return 'great';
    if (score >= 50) return 'good';
    if (score > 0) return 'ok';
    return 'miss';
}
