'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
    rank: number;
    nickname: string;
    totalScore: number;
    correctCount: number;
    totalTimeMs: number;
    createdAt: string;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('/api/leaderboard?limit=50');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || '載入失敗');
            }

            setEntries(data.data.entries);
        } catch (err) {
            setError(err instanceof Error ? err.message : '發生錯誤');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank.toString();
    };

    return (
        <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between py-4 mb-6">
                <button
                    onClick={() => router.push('/')}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    ← 返回
                </button>
                <h1 className="text-xl font-bold">🏆 排行榜</h1>
                <div className="w-16" /> {/* Spacer */}
            </header>

            {/* Loading */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && entries.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="text-6xl mb-4">🏜️</div>
                    <p>還沒有人上榜</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        成為第一名！
                    </button>
                </div>
            )}

            {/* Leaderboard List */}
            {!isLoading && entries.length > 0 && (
                <div className="space-y-2">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm text-gray-500 border-b border-gray-800">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">玩家</div>
                        <div className="col-span-2 text-right">分數</div>
                        <div className="col-span-2 text-center">正確</div>
                        <div className="col-span-2 text-right">時間</div>
                    </div>

                    {/* Entries */}
                    {entries.map((entry) => (
                        <div
                            key={entry.rank}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-xl items-center ${entry.rank <= 3
                                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'
                                : 'bg-gray-900/50'
                                }`}
                        >
                            <div className="col-span-1 text-lg">
                                {getRankEmoji(entry.rank)}
                            </div>
                            <div className="col-span-5 font-medium truncate">
                                {entry.nickname}
                            </div>
                            <div className="col-span-2 text-right font-bold text-blue-400">
                                {entry.totalScore}
                            </div>
                            <div className="col-span-2 text-center text-gray-400">
                                {entry.correctCount}/20
                            </div>
                            <div className="col-span-2 text-right text-gray-500 text-sm">
                                {formatTime(entry.totalTimeMs)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-8 pb-8">
                <button
                    onClick={() => router.push('/')}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <span>🎮</span>
                    挑戰排行榜
                </button>
            </div>
        </div>
    );
}
