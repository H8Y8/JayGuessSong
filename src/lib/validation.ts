import { Database, QuestionItem } from '@/types/database';
import { SCORING_CONFIG } from './scoring';

type GameSession = Database['public']['Tables']['game_sessions']['Row'];

// 錯誤代碼
export const ERROR_CODES = {
    INVALID_NICKNAME: 'INVALID_NICKNAME',
    INVALID_SESSION: 'INVALID_SESSION',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SESSION_FINISHED: 'SESSION_FINISHED',
    INVALID_QUESTION_INDEX: 'INVALID_QUESTION_INDEX',
    INVALID_CHOICE: 'INVALID_CHOICE',
    ALREADY_ANSWERED: 'ALREADY_ANSWERED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
    SESSION_NOT_FINISHED: 'SESSION_NOT_FINISHED',
    INSUFFICIENT_SONGS: 'INSUFFICIENT_SONGS',
    RATE_LIMITED: 'RATE_LIMITED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export interface ValidationResult {
    valid: boolean;
    error?: {
        code: ErrorCode;
        message: string;
    };
}

/**
 * 驗證暱稱格式
 */
export function validateNickname(nickname: string | null | undefined): ValidationResult {
    if (nickname === null || nickname === undefined) {
        return { valid: true }; // 暱稱可選
    }

    const trimmed = nickname.trim();

    if (trimmed.length > 12) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_NICKNAME,
                message: '暱稱最多 12 個字元',
            },
        };
    }

    // 過濾特殊字符（可選）
    const sanitized = trimmed.replace(/[<>'"&]/g, '');
    if (sanitized !== trimmed) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_NICKNAME,
                message: '暱稱包含不允許的字元',
            },
        };
    }

    return { valid: true };
}

/**
 * 驗證 Session 狀態
 */
export function validateSession(session: GameSession | null): ValidationResult {
    if (!session) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_SESSION,
                message: '找不到遊戲，請重新開始',
            },
        };
    }

    if (session.status === 'finished') {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.SESSION_FINISHED,
                message: '遊戲已結束',
            },
        };
    }

    if (session.status === 'expired' || new Date(session.expires_at) < new Date()) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.SESSION_EXPIRED,
                message: '遊戲已逾時，請重新開始',
            },
        };
    }

    return { valid: true };
}

/**
 * 驗證答題請求
 */
export function validateAnswer(
    session: GameSession,
    questionIndex: number,
    chosenIndex: number,
    answerTimeMs: number
): ValidationResult {
    // 檢查題目索引
    if (questionIndex !== session.current_index) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_QUESTION_INDEX,
                message: '題目順序錯誤，請重新整理頁面',
            },
        };
    }

    // 檢查選項範圍 (-1 表示超時未選擇，是有效值)
    if (chosenIndex < -1 || chosenIndex > 3) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_CHOICE,
                message: '無效的選項',
            },
        };
    }

    // 檢查時間範圍
    const maxTime = SCORING_CONFIG.TIME_LIMIT_MS + SCORING_CONFIG.GRACE_MS;
    if (answerTimeMs < 0 || answerTimeMs > maxTime) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_CHOICE,
                message: '答題時間無效',
            },
        };
    }

    return { valid: true };
}

/**
 * 驗證結束遊戲請求
 */
export function validateFinish(
    session: GameSession,
    submitToken: string
): ValidationResult {
    // 檢查 token
    if (session.submit_token !== submitToken) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.INVALID_TOKEN,
                message: '驗證失敗，請重新開始遊戲',
            },
        };
    }

    // 檢查是否已完成所有題目
    if (session.current_index < session.max_questions) {
        return {
            valid: false,
            error: {
                code: ERROR_CODES.SESSION_NOT_FINISHED,
                message: '遊戲尚未完成所有題目',
            },
        };
    }

    return { valid: true };
}

/**
 * 清理暱稱
 */
export function sanitizeNickname(nickname: string | null | undefined): string {
    if (!nickname) return '匿名玩家';
    return nickname.trim().replace(/[<>'"&]/g, '').slice(0, 12) || '匿名玩家';
}
