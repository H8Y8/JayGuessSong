import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateSession, validateFinish, ERROR_CODES } from '@/lib/validation';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, submitToken } = body;

        if (!sessionId || !submitToken) {
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INVALID_TOKEN, message: '請求參數不完整' } },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // 獲取 session
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INVALID_SESSION, message: '找不到遊戲，請重新開始' } },
                { status: 400 }
            );
        }

        // 驗證 finish 請求
        const finishValidation = validateFinish(session, submitToken);
        if (!finishValidation.valid) {
            return NextResponse.json(
                { success: false, error: finishValidation.error },
                { status: 400 }
            );
        }

        // 檢查是否已提交過排行榜
        const { data: existingEntry } = await supabase
            .from('leaderboard_entries')
            .select('id')
            .eq('session_id', sessionId)
            .single();

        if (existingEntry) {
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.ALREADY_SUBMITTED, message: '成績已提交過排行榜' } },
                { status: 400 }
            );
        }

        // 建立排行榜記錄
        const { error: leaderboardError } = await supabase
            .from('leaderboard_entries')
            .insert({
                session_id: sessionId,
                nickname: session.nickname || '匿名玩家',
                total_score: session.total_score,
                correct_count: session.correct_count,
                total_time_ms: session.total_time_ms,
            });

        if (leaderboardError) {
            console.error('Failed to create leaderboard entry:', leaderboardError);
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: '無法提交排行榜' } },
                { status: 500 }
            );
        }

        // 計算排名
        const { count: betterCount } = await supabase
            .from('leaderboard_entries')
            .select('id', { count: 'exact', head: true })
            .or(`total_score.gt.${session.total_score},and(total_score.eq.${session.total_score},total_time_ms.lt.${session.total_time_ms})`);

        const rank = (betterCount ?? 0) + 1;

        // 計算總玩家數
        const { count: totalPlayers } = await supabase
            .from('leaderboard_entries')
            .select('id', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            data: {
                totalScore: session.total_score,
                correctCount: session.correct_count,
                totalQuestions: session.max_questions,
                accuracy: session.correct_count / session.max_questions,
                totalTimeMs: session.total_time_ms,
                averageTimeMs: Math.round(session.total_time_ms / session.max_questions),
                rank,
                totalPlayers: totalPlayers || 0,
                isNewHighScore: rank <= 10,
            },
        });
    } catch (error) {
        console.error('Finish error:', error);
        return NextResponse.json(
            { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: '系統錯誤，請稍後再試' } },
            { status: 500 }
        );
    }
}
