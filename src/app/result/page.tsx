'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GameResult {
    sessionId: string;
    submitToken: string;
    totalScore: number;
    correctCount?: number;
    progress?: { correctCount: number; total: number };
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

export default function ResultPage() {
    const router = useRouter();
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [finishResult, setFinishResult] = useState<FinishResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('gameResult');
        if (!stored) {
            router.replace('/');
            return;
        }

        try {
            const data = JSON.parse(stored);
            setGameResult(data);
        } catch {
            router.replace('/');
        }
    }, [router]);

    const submitToLeaderboard = async () => {
        if (!gameResult || isSubmitting || isSubmitted) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/game/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: gameResult.sessionId,
                    submitToken: gameResult.submitToken,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || '提交失敗');
            }

            setFinishResult(data.data);
            setIsSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : '發生錯誤');
        } finally {
            setIsSubmitting(false);
        }
    };

    const playAgain = () => {
        sessionStorage.removeItem('gameSession');
        sessionStorage.removeItem('gameResult');
        router.push('/');
    };

    if (!gameResult) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const correctCount = gameResult.correctCount || gameResult.progress?.correctCount || 0;
    const totalQuestions = gameResult.progress?.total || 20;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* 結果卡片 */}
                <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 text-center mb-6">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold mb-6">遊戲結束！</h1>

                    {/* 分數顯示 */}
                    <div className="mb-8">
                        <div className="text-5xl font-bold text-blue-400 mb-2">
                            {gameResult.totalScore}
                        </div>
                        <div className="text-gray-400">總分</div>
                    </div>

                    {/* 統計 */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-green-400">
                                {correctCount}/{totalQuestions}
                            </div>
                            <div className="text-sm text-gray-400">答對題數</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-blue-400">
                                {Math.round((correctCount / totalQuestions) * 100)}%
                            </div>
                            <div className="text-sm text-gray-400">正確率</div>
                        </div>
                    </div>

                    {/* 排行榜結果 */}
                    {finishResult && (
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
                            <div className="text-lg font-semibold mb-2">
                                {finishResult.isNewHighScore ? '🏆 進入前 10 名！' : '📊 排行榜成績'}
                            </div>
                            <div className="text-3xl font-bold text-yellow-400">
                                第 {finishResult.rank} 名
                            </div>
                            <div className="text-sm text-gray-400">
                                共 {finishResult.totalPlayers} 位玩家
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* 按鈕 */}
                    <div className="space-y-3">
                        {!isSubmitted && (
                            <button
                                onClick={submitToLeaderboard}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        提交中...
                                    </>
                                ) : (
                                    <>
                                        <span>🏆</span>
                                        提交排行榜
                                    </>
                                )}
                            </button>
                        )}

                        {isSubmitted && (
                            <button
                                onClick={() => router.push('/leaderboard')}
                                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <span>📊</span>
                                查看排行榜
                            </button>
                        )}

                        <button
                            onClick={playAgain}
                            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <span>🔄</span>
                            再玩一次
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
