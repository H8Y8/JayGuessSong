import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateScore } from '@/lib/scoring';
import { validateSession, validateAnswer, ERROR_CODES } from '@/lib/validation';
import { loadSongsMap, getQuestionDisplay } from '@/lib/questionGenerator';
import { QuestionItem, GameSession } from '@/types/database';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, questionIndex, chosenIndex, answerTimeMs } = body;

        if (!sessionId || questionIndex === undefined || chosenIndex === undefined || answerTimeMs === undefined) {
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INVALID_CHOICE, message: '請求參數不完整' } },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // 獲取 session
        const { data: sessionData, error: sessionError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData) {
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INVALID_SESSION, message: '找不到遊戲，請重新開始' } },
                { status: 400 }
            );
        }

        // 明確類型轉換
        const session = sessionData as unknown as GameSession;

        // 驗證 session 狀態
        const sessionValidation = validateSession(session);
        if (!sessionValidation.valid) {
            return NextResponse.json(
                { success: false, error: sessionValidation.error },
                { status: 400 }
            );
        }

        // 驗證答題請求
        const answerValidation = validateAnswer(session, questionIndex, chosenIndex, answerTimeMs);
        if (!answerValidation.valid) {
            return NextResponse.json(
                { success: false, error: answerValidation.error },
                { status: 400 }
            );
        }

        // 檢查是否已作答 - 如果已作答，返回已儲存的結果而非錯誤
        const { data: existingAnswer } = await supabase
            .from('game_answers')
            .select('*')
            .eq('session_id', sessionId)
            .eq('question_index', questionIndex)
            .single();

        if (existingAnswer) {
            // 已經作答過，返回已儲存的結果（處理競態條件的重複提交）
            const questions = session.questions as QuestionItem[];
            const currentQuestion = questions[questionIndex];
            const songsMap = await loadSongsMap();
            const correctSong = songsMap.get(currentQuestion.song_id);

            const newIndex = questionIndex + 1;
            const isFinished = newIndex >= session.max_questions;

            // 重新獲取最新的 session 狀態
            const { data: latestSession } = await supabase
                .from('game_sessions')
                .select('total_score, correct_count')
                .eq('id', sessionId)
                .single();

            const response: {
                success: boolean;
                data: {
                    isCorrect: boolean;
                    correctIndex: number;
                    correctTitle: string;
                    scoreGained: number;
                    totalScore: number;
                    isFinished: boolean;
                    progress: { current: number; total: number; correctCount: number };
                    next?: { questionIndex: number; youtube: { videoId: string; startSec: number }; options: string[] };
                };
            } = {
                success: true,
                data: {
                    isCorrect: existingAnswer.is_correct,
                    correctIndex: currentQuestion.correct_index,
                    correctTitle: correctSong?.title_zh || '未知歌曲',
                    scoreGained: existingAnswer.score,
                    totalScore: latestSession?.total_score || session.total_score,
                    isFinished,
                    progress: {
                        current: newIndex,
                        total: session.max_questions,
                        correctCount: latestSession?.correct_count || session.correct_count,
                    },
                },
            };

            // 如果還有下一題，附上下一題資料
            if (!isFinished) {
                const nextQuestion = questions[newIndex];
                const nextDisplay = await getQuestionDisplay(nextQuestion, songsMap);
                response.data.next = {
                    questionIndex: newIndex,
                    youtube: nextDisplay.youtube,
                    options: nextDisplay.options,
                };
            }

            return NextResponse.json(response);
        }

        // 獲取當前題目
        const questions = session.questions as QuestionItem[];
        const currentQuestion = questions[questionIndex];

        // 判斷是否正確
        const isCorrect = chosenIndex === currentQuestion.correct_index;

        // 計算分數
        const score = calculateScore(answerTimeMs, isCorrect);

        // 計算新狀態
        const newIndex = questionIndex + 1;
        const isFinished = newIndex >= session.max_questions;

        // 並行執行：儲存答案、更新 session、載入歌曲資料
        const [answerResult, updateResult, songsMap] = await Promise.all([
            // 儲存答案
            supabase.from('game_answers').insert({
                session_id: sessionId,
                question_index: questionIndex,
                chosen_index: chosenIndex,
                is_correct: isCorrect,
                answer_time_ms: answerTimeMs,
                score,
            }),
            // 更新 session
            supabase.from('game_sessions').update({
                current_index: newIndex,
                total_score: session.total_score + score,
                correct_count: session.correct_count + (isCorrect ? 1 : 0),
                total_time_ms: session.total_time_ms + answerTimeMs,
                ...(isFinished && { status: 'finished', finished_at: new Date().toISOString() }),
            }).eq('id', sessionId),
            // 載入歌曲資料
            loadSongsMap(),
        ]);

        if (answerResult.error) {
            console.error('Failed to save answer:', answerResult.error);
            return NextResponse.json(
                { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: '無法儲存答案' } },
                { status: 500 }
            );
        }

        if (updateResult.error) {
            console.error('Failed to update session:', updateResult.error);
        }

        const correctSong = songsMap.get(currentQuestion.song_id);

        // 準備回應
        const response: {
            success: boolean;
            data: {
                isCorrect: boolean;
                correctIndex: number;
                correctTitle: string;
                scoreGained: number;
                totalScore: number;
                isFinished: boolean;
                progress: { current: number; total: number; correctCount: number };
                next?: { questionIndex: number; youtube: { videoId: string; startSec: number }; options: string[] };
            };
        } = {
            success: true,
            data: {
                isCorrect,
                correctIndex: currentQuestion.correct_index,
                correctTitle: correctSong?.title_zh || '未知歌曲',
                scoreGained: score,
                totalScore: session.total_score + score,
                isFinished,
                progress: {
                    current: newIndex,
                    total: session.max_questions,
                    correctCount: session.correct_count + (isCorrect ? 1 : 0),
                },
            },
        };

        // 如果還有下一題，附上下一題資料
        if (!isFinished) {
            const nextQuestion = questions[newIndex];
            const nextDisplay = await getQuestionDisplay(nextQuestion, songsMap);
            response.data.next = {
                questionIndex: newIndex,
                youtube: nextDisplay.youtube,
                options: nextDisplay.options,
            };
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Answer error:', error);
        return NextResponse.json(
            { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: '系統錯誤，請稍後再試' } },
            { status: 500 }
        );
    }
}
