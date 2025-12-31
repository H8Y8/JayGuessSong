'use client';

import { useState, useCallback, useRef } from 'react';

interface GameSession {
    sessionId: string;
    submitToken: string;
    timeLimitSec: number;
    totalQuestions: number;
}

interface QuestionData {
    questionIndex: number;
    youtube: {
        videoId: string;
        startSec: number;
    };
    options: string[];
}

interface AnswerResult {
    isCorrect: boolean;
    correctIndex: number;
    correctTitle: string;
    scoreGained: number;
    totalScore: number;
    isFinished: boolean;
    progress: {
        current: number;
        total: number;
        correctCount: number;
    };
    next?: QuestionData;
}

interface FinishResult {
    totalScore: number;
    correctCount: number;
    totalQuestions: number;
    accuracy: number;
    totalTimeMs: number;
    averageTimeMs: number;
    rank: number;
    totalPlayers: number;
    isNewHighScore: boolean;
}

type GameState = 'idle' | 'loading' | 'playing' | 'answered' | 'finished' | 'error';

export function useGameSession() {
    const [session, setSession] = useState<GameSession | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null);
    const [finishResult, setFinishResult] = useState<FinishResult | null>(null);

    const questionStartTimeRef = useRef<number>(0);

    const startGame = useCallback(async (nickname?: string) => {
        setGameState('loading');
        setError(null);
        setScore(0);
        setCorrectCount(0);

        try {
            const response = await fetch('/api/game/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || '無法開始遊戲');
            }

            setSession({
                sessionId: data.data.sessionId,
                submitToken: data.data.submitToken,
                timeLimitSec: data.data.timeLimitSec,
                totalQuestions: data.data.totalQuestions,
            });

            setCurrentQuestion({
                questionIndex: data.data.questionIndex,
                youtube: data.data.youtube,
                options: data.data.options,
            });

            questionStartTimeRef.current = Date.now();
            setGameState('playing');
        } catch (err) {
            setError(err instanceof Error ? err.message : '發生錯誤');
            setGameState('error');
        }
    }, []);

    const submitAnswer = useCallback(async (chosenIndex: number) => {
        if (!session || !currentQuestion) return;

        const answerTimeMs = Date.now() - questionStartTimeRef.current;

        setGameState('loading');

        try {
            const response = await fetch('/api/game/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    questionIndex: currentQuestion.questionIndex,
                    chosenIndex,
                    answerTimeMs,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || '無法提交答案');
            }

            const result = data.data as AnswerResult;
            setLastAnswer(result);
            setScore(result.totalScore);
            setCorrectCount(result.progress.correctCount);

            if (result.isFinished) {
                setGameState('finished');
            } else {
                setGameState('answered');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '發生錯誤');
            setGameState('error');
        }
    }, [session, currentQuestion]);

    const goToNextQuestion = useCallback(() => {
        if (!lastAnswer?.next) return;

        setCurrentQuestion(lastAnswer.next);
        setLastAnswer(null);
        questionStartTimeRef.current = Date.now();
        setGameState('playing');
    }, [lastAnswer]);

    const finishGame = useCallback(async () => {
        if (!session) return;

        setGameState('loading');

        try {
            const response = await fetch('/api/game/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    submitToken: session.submitToken,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || '無法提交成績');
            }

            setFinishResult(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '發生錯誤');
            setGameState('error');
        }
    }, [session]);

    const resetGame = useCallback(() => {
        setSession(null);
        setCurrentQuestion(null);
        setScore(0);
        setCorrectCount(0);
        setGameState('idle');
        setError(null);
        setLastAnswer(null);
        setFinishResult(null);
    }, []);

    return {
        session,
        currentQuestion,
        score,
        correctCount,
        gameState,
        error,
        lastAnswer,
        finishResult,
        startGame,
        submitAnswer,
        goToNextQuestion,
        finishGame,
        resetGame,
        getElapsedTime: () => Date.now() - questionStartTimeRef.current,
    };
}
