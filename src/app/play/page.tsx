'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTimer } from '@/hooks/useTimer';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

interface GameData {
    sessionId: string;
    submitToken: string;
    timeLimitSec: number;
    totalQuestions: number;
    questionIndex: number;
    youtube: { videoId: string; startSec: number };
    options: string[];
    score?: number;        // 用於恢復耐久化狀態
    correctCount?: number; // 用於恢復耐久化狀態
}

interface AnswerResult {
    isCorrect: boolean;
    correctIndex: number;
    correctTitle: string;
    scoreGained: number;
    totalScore: number;
    isFinished: boolean;
    progress: { current: number; total: number; correctCount: number };
    next?: {
        questionIndex: number;
        youtube: { videoId: string; startSec: number };
        options: string[];
    };
}

export default function PlayPage() {
    const router = useRouter();
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true); // 獨立控制毛玻璃效果
    const [needsUserInteraction, setNeedsUserInteraction] = useState(true); // iOS Safari 需要使用者互動才能播放
    const [error, setError] = useState<string | null>(null);

    // 用於防止重複提交的 ref
    const hasSubmittedRef = useRef(false);

    const handleTimeout = useCallback(() => {
        // 檢查是否已經選擇或正在提交或已經提交過
        if (!gameData || selectedIndex !== null || isSubmitting || hasSubmittedRef.current) return;
        submitAnswer(-1); // 超時
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameData, selectedIndex, isSubmitting]);

    const timer = useTimer({
        initialSeconds: 15,
        onTimeout: handleTimeout,
        autoStart: false,
    });

    // 用於追蹤當前載入的影片 ID，避免重複載入
    const currentVideoRef = useRef<string | null>(null);
    // 用於追蹤是否需要載入影片
    const needsLoadRef = useRef(true);
    // 用於追蹤當前 session ID，偵測是否為新遊戲
    const currentSessionRef = useRef<string | null>(null);

    const player = useYouTubePlayer({
        containerId: 'youtube-player',
        onReady: () => {
            // 播放器準備好時標記需要載入
            needsLoadRef.current = true;
        },
    });

    // 載入遊戲資料的核心函數
    const loadGameData = useCallback(() => {
        const stored = sessionStorage.getItem('gameSession');
        if (!stored) {
            router.replace('/');
            return;
        }

        try {
            const data = JSON.parse(stored) as GameData;

            // 檢查是否為新的遊戲 session（用於處理瀏覽器返回後重新開始的情況）
            const isNewSession = currentSessionRef.current !== null &&
                currentSessionRef.current !== data.sessionId;

            if (isNewSession) {
                // 新遊戲：重置所有狀態
                setScore(0);
                setCorrectCount(0);
                setSelectedIndex(null);
                setAnswerResult(null);
                setIsTimeout(false);
                setShowOverlay(true);
                setError(null);
                hasSubmittedRef.current = false;
                currentVideoRef.current = null;
                needsLoadRef.current = true;
            } else {
                // 恢復遊戲或首次載入：還原儲存的分數
                if (data.score !== undefined) setScore(data.score);
                if (data.correctCount !== undefined) setCorrectCount(data.correctCount);
            }

            currentSessionRef.current = data.sessionId;
            setGameData(data);
            // 標記需要載入影片
            needsLoadRef.current = true;
        } catch {
            router.replace('/');
        }
    }, [router]);

    // 載入遊戲資料（組件掛載時 + 頁面恢復時執行）
    useEffect(() => {
        // 初始載入
        loadGameData();

        // 監聽 pageshow 事件（處理 bfcache 恢復）
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // 頁面從 bfcache 恢復，重新載入資料
                loadGameData();
            }
        };

        // 監聽 visibilitychange 事件（處理頁面可見性變化）
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // 頁面變為可見時，檢查 session 是否有變化
                const stored = sessionStorage.getItem('gameSession');
                if (stored) {
                    try {
                        const data = JSON.parse(stored) as GameData;
                        if (data.sessionId !== currentSessionRef.current) {
                            // session 已變化，重新載入
                            loadGameData();
                        }
                    } catch {
                        // 忽略解析錯誤
                    }
                }
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadGameData]);

    // 將遊戲狀態同步到 sessionStorage（用於頁面重新整理後恢復）
    useEffect(() => {
        if (gameData) {
            sessionStorage.setItem('gameSession', JSON.stringify({
                ...gameData,
                score,
                correctCount,
            }));
        }
    }, [gameData, score, correctCount]);

    // 載入並播放影片的函數
    const loadAndPlayVideo = useCallback(() => {
        if (!gameData || !player.isReady) return;

        const videoId = gameData.youtube.videoId;

        // 如果已經載入同一個影片且不需要重新載入，跳過
        if (currentVideoRef.current === videoId && !needsLoadRef.current) return;

        // 載入新影片
        currentVideoRef.current = videoId;
        needsLoadRef.current = false;
        player.loadVideo(videoId, gameData.youtube.startSec);

        setTimeout(() => {
            player.play();
            timer.restart();
        }, 500);
    }, [gameData, player, timer]);

    // 當播放器準備好或 gameData 變化時，嘗試載入影片（僅在使用者已互動後）
    useEffect(() => {
        if (!needsUserInteraction) {
            loadAndPlayVideo();
        }
    }, [loadAndPlayVideo, player.isReady, needsUserInteraction]);

    // 使用者點擊開始播放的處理函數
    const handleStartPlaying = useCallback(() => {
        setNeedsUserInteraction(false);
        loadAndPlayVideo();
    }, [loadAndPlayVideo]);

    const submitAnswer = async (chosenIndex: number) => {
        // 防止重複提交
        if (!gameData || isSubmitting || hasSubmittedRef.current) return;

        hasSubmittedRef.current = true; // 標記為已提交

        const timeout = chosenIndex === -1;
        setIsSubmitting(true);
        setSelectedIndex(timeout ? null : chosenIndex);
        setIsTimeout(timeout);
        setShowOverlay(false); // 揭曉答案時隱藏毛玻璃
        timer.pause();
        player.pause();

        const answerTimeMs = timeout ? 15000 : (15 - timer.timeLeft) * 1000;

        try {
            const response = await fetch('/api/game/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: gameData.sessionId,
                    questionIndex: gameData.questionIndex,
                    chosenIndex: timeout ? -1 : chosenIndex, // 傳 -1 表示超時
                    answerTimeMs,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || '提交失敗');
            }

            const result = data.data as AnswerResult;
            setAnswerResult(result);
            setScore(result.totalScore);
            setCorrectCount(result.progress.correctCount);

            if (result.isFinished) {
                // 儲存結果並跳轉
                sessionStorage.setItem('gameResult', JSON.stringify({
                    sessionId: gameData.sessionId,
                    submitToken: gameData.submitToken,
                    ...result,
                }));
                setTimeout(() => router.push('/result'), 3000);
            } else {
                // 顯示清晰影片 3 秒後自動進入下一題
                setTimeout(() => {
                    if (result.next) {
                        // 先顯示毛玻璃遮罩
                        setShowOverlay(true);
                        setSelectedIndex(null);
                        setAnswerResult(null);
                        setIsTimeout(false);
                        hasSubmittedRef.current = false; // 重置提交狀態，允許新題目提交

                        // 重置 currentVideoRef 讓 useEffect 能載入新影片
                        currentVideoRef.current = null;

                        // 等待毛玻璃動畫完成後更新 gameData
                        // useEffect 會自動處理影片載入和計時器啟動
                        setTimeout(() => {
                            setGameData({
                                ...gameData,
                                questionIndex: result.next!.questionIndex,
                                youtube: result.next!.youtube,
                                options: result.next!.options,
                            });
                        }, 300); // 等待毛玻璃動畫（300ms）
                    }
                }, 3000);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '發生錯誤';
            setError(errorMessage);
            hasSubmittedRef.current = false; // 重置，允許重試
            // 5 秒後自動清除錯誤
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const goToNextQuestion = () => {
        if (!answerResult?.next || !gameData) return;

        const next = answerResult.next;

        // 先顯示毛玻璃遮罩
        setShowOverlay(true);
        setSelectedIndex(null);
        setAnswerResult(null);
        setIsTimeout(false);
        hasSubmittedRef.current = false; // 重置提交狀態

        // 重置 currentVideoRef 讓 useEffect 能載入新影片
        currentVideoRef.current = null;

        // 等待毛玻璃動畫完成後更新 gameData
        // useEffect 會自動處理影片載入和計時器啟動
        setTimeout(() => {
            setGameData({
                ...gameData,
                questionIndex: next.questionIndex,
                youtube: next.youtube,
                options: next.options,
            });
        }, 300);
    };

    if (!gameData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-3 max-w-2xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center py-2">
                <div className="text-sm text-gray-400">
                    題目 {gameData.questionIndex + 1} / {gameData.totalQuestions}
                </div>
                <div className="text-lg font-bold text-blue-400">
                    {score} 分
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((gameData.questionIndex + 1) / gameData.totalQuestions) * 100}%` }}
                />
            </div>

            {/* YouTube Player with Frosted Glass Effect */}
            <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-xl">
                    {/* YouTube Player */}
                    <div id="youtube-player" className="absolute inset-0 w-full h-full" />

                    {/* Frosted Glass Overlay - 使用獨立狀態控制 */}
                    <div
                        className={`absolute inset-0 backdrop-blur-xl bg-black/40 flex flex-col items-center justify-center transition-all duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                    >
                        {needsUserInteraction ? (
                            /* iOS Safari 需要使用者點擊才能播放 */
                            <button
                                onClick={handleStartPlaying}
                                className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-3 shadow-lg hover:bg-blue-600 transition-colors">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <p className="text-white text-lg font-medium">點擊開始播放</p>
                            </button>
                        ) : (
                            <>
                                <div className="text-5xl mb-1">🎵</div>
                                <p className="text-gray-300 text-xs">仔細聽...</p>
                            </>
                        )}
                    </div>

                    {/* Answer overlay on video - 更明顯的顯示 */}
                    {answerResult && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 animate-fadeIn">
                            {/* 結果圖示 */}
                            <div className={`text-5xl mb-2 ${answerResult.isCorrect ? 'animate-bounce' : 'animate-shake'}`}>
                                {answerResult.isCorrect ? '🎉' : (isTimeout ? '⏰' : '😢')}
                            </div>

                            {/* 結果文字 */}
                            <p className={`text-xl font-bold mb-1 ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {answerResult.isCorrect ? '✓ 答對了！' : (isTimeout ? '時間到！' : '✗ 答錯了')}
                            </p>

                            {/* 正確答案 */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 mt-1">
                                <p className="text-gray-400 text-xs mb-0.5">正確答案</p>
                                <p className="text-white text-lg font-bold">{answerResult.correctTitle}</p>
                            </div>

                            {/* 得分 */}
                            {answerResult.isCorrect && (
                                <p className="text-yellow-400 text-base mt-2 font-medium">
                                    +{answerResult.scoreGained} 分
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Timer */}
                <div className={`text-4xl font-bold tabular-nums mt-3 ${timer.isUrgent ? 'timer-urgent' : 'text-white'}`}>
                    {timer.timeLeft}
                </div>
                <div className="text-gray-500 text-sm">秒</div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2 mt-auto mb-4">
                {gameData.options.map((option, index) => {
                    const isSelected = selectedIndex === index;
                    const isCorrect = answerResult?.correctIndex === index;
                    const showResult = answerResult !== null;
                    const isPending = isSelected && !showResult && isSubmitting;

                    let buttonClass = 'option-button w-full py-3 px-4 rounded-lg border-2 text-left font-medium transition-all text-sm ';

                    if (showResult) {
                        // 顯示答案結果
                        if (isCorrect) {
                            buttonClass += 'correct text-white border-green-500';
                        } else if (isSelected && !isCorrect) {
                            buttonClass += 'wrong text-white border-red-500';
                        } else {
                            buttonClass += 'bg-gray-800/50 border-gray-700 text-gray-400 opacity-50';
                        }
                    } else if (isPending) {
                        // 已選擇，等待結果
                        buttonClass += 'bg-blue-900/50 border-blue-500 text-white animate-pulse';
                    } else if (isSubmitting) {
                        // 其他選項在提交中
                        buttonClass += 'bg-gray-800/50 border-gray-700 text-gray-400 opacity-50 cursor-not-allowed';
                    } else {
                        // 正常可選狀態
                        buttonClass += 'bg-gray-800 border-gray-700 text-white hover:border-blue-500 hover:bg-gray-700';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => !showResult && !isSubmitting && submitAnswer(index)}
                            disabled={showResult || isSubmitting}
                            className={buttonClass}
                        >
                            <span className="inline-block w-6 h-6 rounded-full bg-gray-700 text-center leading-6 mr-2 text-xs">
                                {['A', 'B', 'C', 'D'][index]}
                            </span>
                            {option}
                        </button>
                    );
                })}
            </div>

            {/* Answer Feedback Modal - 僅顯示在遊戲結束時 */}
            {answerResult && answerResult.isFinished && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold mb-2 text-white">
                            遊戲結束！
                        </h2>
                        <p className="text-gray-400 mb-4">
                            即將跳轉至結果頁面...
                        </p>
                    </div>
                </div>
            )}

            {/* Error - 5秒後自動消失，可手動關閉 */}
            {error && (
                <div className="fixed bottom-4 left-4 right-4 bg-red-500/95 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn z-50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-white/80 hover:text-white text-xl p-1"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
