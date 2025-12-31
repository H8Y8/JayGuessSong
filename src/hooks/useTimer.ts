'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerProps {
    initialSeconds: number;
    onTimeout?: () => void;
    autoStart?: boolean;
}

export function useTimer({ initialSeconds, onTimeout, autoStart = false }: UseTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(autoStart);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onTimeoutRef = useRef(onTimeout);

    // 更新 callback ref
    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    // 清理 interval
    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // 計時器邏輯
    useEffect(() => {
        if (!isRunning) {
            clearTimer();
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    setIsRunning(false);
                    onTimeoutRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return clearTimer;
    }, [isRunning, clearTimer]);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback((newSeconds?: number) => {
        setTimeLeft(newSeconds ?? initialSeconds);
        setIsRunning(false);
    }, [initialSeconds]);

    const restart = useCallback((newSeconds?: number) => {
        setTimeLeft(newSeconds ?? initialSeconds);
        setIsRunning(true);
    }, [initialSeconds]);

    // 計算進度百分比 (0-100)
    const progress = Math.max(0, Math.min(100, (timeLeft / initialSeconds) * 100));

    // 是否快超時 (剩餘 3 秒)
    const isUrgent = timeLeft <= 3 && timeLeft > 0;

    return {
        timeLeft,
        isRunning,
        progress,
        isUrgent,
        start,
        pause,
        reset,
        restart,
    };
}
