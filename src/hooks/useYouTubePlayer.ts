'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

declare global {
    interface Window {
        YT: {
            Player: new (
                elementId: string,
                config: {
                    height?: string | number;
                    width?: string | number;
                    videoId?: string;
                    playerVars?: Record<string, unknown>;
                    events?: {
                        onReady?: (event: { target: YTPlayer }) => void;
                        onStateChange?: (event: { data: number }) => void;
                        onError?: (event: { data: number }) => void;
                    };
                }
            ) => YTPlayer;
            PlayerState: {
                UNSTARTED: -1;
                ENDED: 0;
                PLAYING: 1;
                PAUSED: 2;
                BUFFERING: 3;
                CUED: 5;
            };
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}

interface YTPlayer {
    loadVideoById: (config: { videoId: string; startSeconds?: number }) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    getPlayerState: () => number;
    destroy: () => void;
}

interface UseYouTubePlayerProps {
    containerId: string;
    onReady?: () => void;
    onStateChange?: (state: number) => void;
    onError?: (errorCode: number) => void;
}

export function useYouTubePlayer({
    containerId,
    onReady,
    onStateChange,
    onError,
}: UseYouTubePlayerProps) {
    const playerRef = useRef<YTPlayer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isInitializingRef = useRef(false);
    const onReadyRef = useRef(onReady);
    const onStateChangeRef = useRef(onStateChange);
    const onErrorRef = useRef(onError);

    // 更新 callback refs
    useEffect(() => {
        onReadyRef.current = onReady;
        onStateChangeRef.current = onStateChange;
        onErrorRef.current = onError;
    }, [onReady, onStateChange, onError]);

    // 初始化 player 的函數
    const initPlayer = useCallback(() => {
        // 防止重複初始化
        if (!window.YT || isInitializingRef.current) return;

        // 如果已經有 player 且可以使用，跳過
        if (playerRef.current) {
            try {
                // 嘗試呼叫一個方法來驗證 player 是否有效
                playerRef.current.getPlayerState();
                // player 有效，確保狀態正確
                if (!isReady) {
                    setIsReady(true);
                    setIsLoading(false);
                }
                return;
            } catch {
                // player 無效，清除並重新創建
                playerRef.current = null;
                setIsReady(false);
            }
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        isInitializingRef.current = true;

        // 清除容器內容以確保可以重新創建 player
        container.innerHTML = '';

        playerRef.current = new window.YT.Player(containerId, {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                showinfo: 0,
            },
            events: {
                onReady: () => {
                    isInitializingRef.current = false;
                    setIsReady(true);
                    setIsLoading(false);
                    onReadyRef.current?.();
                },
                onStateChange: (event) => {
                    const state = event.data;
                    setIsPlaying(state === window.YT.PlayerState.PLAYING);
                    setIsLoading(state === window.YT.PlayerState.BUFFERING);
                    onStateChangeRef.current?.(state);
                },
                onError: (event) => {
                    isInitializingRef.current = false;
                    onErrorRef.current?.(event.data);
                },
            },
        });
    }, [containerId, isReady]);

    // 載入 YouTube IFrame API
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 已經載入過 API
        if (window.YT && window.YT.Player) {
            initPlayer();
            return;
        }

        // 載入 API script
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (!existingScript) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // callback
        window.onYouTubeIframeAPIReady = initPlayer;

        return () => {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch {
                    // 忽略銷毀錯誤
                }
                playerRef.current = null;
            }
            isInitializingRef.current = false;
            setIsReady(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 當 API 已經載入但 player 未初始化時，嘗試初始化
    useEffect(() => {
        if (window.YT && window.YT.Player && !playerRef.current && !isInitializingRef.current) {
            initPlayer();
        }
    }, [initPlayer]);

    const loadVideo = useCallback((videoId: string, startSeconds: number = 0) => {
        if (!playerRef.current || !isReady) return;
        setIsLoading(true);
        playerRef.current.loadVideoById({ videoId, startSeconds });
    }, [isReady]);

    const play = useCallback(() => {
        if (!playerRef.current || !isReady) return;
        playerRef.current.playVideo();
    }, [isReady]);

    const pause = useCallback(() => {
        if (!playerRef.current || !isReady) return;
        playerRef.current.pauseVideo();
    }, [isReady]);

    const stop = useCallback(() => {
        if (!playerRef.current || !isReady) return;
        playerRef.current.stopVideo();
    }, [isReady]);

    return {
        isReady,
        isPlaying,
        isLoading,
        loadVideo,
        play,
        pause,
        stop,
    };
}
