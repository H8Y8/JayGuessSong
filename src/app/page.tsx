'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 每次進入首頁時清除舊的遊戲資料，確保狀態是乾淨的
  useEffect(() => {
    sessionStorage.removeItem('gameSession');
    sessionStorage.removeItem('gameResult');
  }, []);

  const handleStart = async () => {
    if (nickname.length > 12) {
      setError('暱稱最多 12 個字元');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() || null }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || '無法開始遊戲');
        setIsLoading(false);
        return;
      }

      // 儲存遊戲資料到 sessionStorage（包含初始分數）
      sessionStorage.setItem('gameSession', JSON.stringify({
        ...data.data,
        score: 0,
        correctCount: 0,
      }));
      // 使用 window.location.href 強制完整頁面跳轉，避免 bfcache 問題
      window.location.href = '/play';
    } catch {
      setError('網路錯誤，請稍後再試');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Logo / Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-400">
          周杰倫猜歌挑戰
        </h1>
      </div>

      {/* 遊戲卡片 */}
      <div className="w-full max-w-md bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
        {/* 規則說明 */}
        <div className="mb-8 text-gray-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎮</span> 遊戲規則
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>共 20 題，每題播放一段周杰倫的歌曲</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>四選一，每題限時 15 秒</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>答對越快分數越高，最高 100 分/題</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>完成後可上傳排行榜，挑戰最高分！</span>
            </li>
          </ul>
        </div>

        {/* 暱稱輸入 */}
        <div className="mb-6">
          <label htmlFor="nickname" className="block text-sm text-gray-400 mb-2">
            你的暱稱（選填）
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="輸入暱稱..."
            maxLength={12}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {nickname.length}/12
          </p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 開始按鈕 */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>載入中...</span>
            </>
          ) : (
            <>
              <span>🎵</span>
              <span>開始遊戲</span>
            </>
          )}
        </button>
      </div>

      {/* 排行榜連結 */}
      <button
        onClick={() => router.push('/leaderboard')}
        className="mt-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <span>🏆</span>
        <span>查看排行榜</span>
      </button>

      {/* Footer */}
      <footer className="mt-12 text-gray-600 text-sm">
        使用 YouTube 內嵌播放 • 不下載音檔
      </footer>
    </div>
  );
}
