import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = createAdminClient();

        // 獲取排行榜
        const { data: entries, error, count } = await supabase
            .from('leaderboard_entries')
            .select('*', { count: 'exact' })
            .order('total_score', { ascending: false })
            .order('total_time_ms', { ascending: true })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Failed to fetch leaderboard:', error);
            return NextResponse.json(
                { success: false, error: { code: 'INTERNAL_ERROR', message: '無法載入排行榜' } },
                { status: 500 }
            );
        }

        // 加入排名
        const entriesWithRank = entries?.map((entry, index) => ({
            rank: offset + index + 1,
            nickname: entry.nickname,
            totalScore: entry.total_score,
            correctCount: entry.correct_count,
            totalTimeMs: entry.total_time_ms,
            createdAt: entry.created_at,
        })) || [];

        return NextResponse.json({
            success: true,
            data: {
                entries: entriesWithRank,
                total: count || 0,
                hasMore: (count || 0) > offset + limit,
            },
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: '系統錯誤，請稍後再試' } },
            { status: 500 }
        );
    }
}
