import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateQuestions, loadSongsMap, getQuestionDisplay } from '@/lib/questionGenerator';
import { validateNickname, sanitizeNickname, ERROR_CODES } from '@/lib/validation';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { nickname } = body;

        // 驗證暱稱
        const nicknameValidation = validateNickname(nickname);
        if (!nicknameValidation.valid) {
            return NextResponse.json(
                { success: false, error: nicknameValidation.error },
                { status: 400 }
            );
        }

        // 生成題目
        const { questions, seed } = await generateQuestions();

        // 生成提交 token
        const submitToken = randomBytes(32).toString('hex');

        // 計算過期時間 (20題 × 15秒 + 5分鐘緩衝)
        const expiresAt = new Date(Date.now() + 20 * 15 * 1000 + 5 * 60 * 1000);

        // 建立 session
        const supabase = createAdminClient();
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .insert({
                nickname: sanitizeNickname(nickname),
                seed,
                questions,
                submit_token: submitToken,
                expires_at: expiresAt.toISOString(),
                client_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                user_agent: request.headers.get('user-agent'),
            })
            .select()
            .single();

        if (sessionError || !session) {
            console.error('Failed to create session:', sessionError);
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: '無法建立遊戲' } },
                { status: 500 }
            );
        }

        // 載入歌曲資料
        const songsMap = await loadSongsMap();

        // 取得第一題顯示資料
        const firstQuestion = questions[0];
        const questionDisplay = await getQuestionDisplay(firstQuestion, songsMap);

        return NextResponse.json({
            success: true,
            data: {
                sessionId: session.id,
                submitToken,
                timeLimitSec: session.time_limit_sec,
                totalQuestions: session.max_questions,
                questionIndex: 0,
                youtube: questionDisplay.youtube,
                options: questionDisplay.options,
            },
        });
    } catch (error) {
        console.error('Start game error:', error);

        if (error instanceof Error && error.message.includes('題庫不足')) {
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INSUFFICIENT_SONGS, message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: '系統錯誤，請稍後再試' } },
            { status: 500 }
        );
    }
}
