export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            songs: {
                Row: {
                    id: string
                    title_zh: string
                    album: string | null
                    year: number | null
                    youtube_video_id: string
                    start_sec: number
                    duration_sec: number | null
                    difficulty: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title_zh: string
                    album?: string | null
                    year?: number | null
                    youtube_video_id: string
                    start_sec?: number
                    duration_sec?: number | null
                    difficulty?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title_zh?: string
                    album?: string | null
                    year?: number | null
                    youtube_video_id?: string
                    start_sec?: number
                    duration_sec?: number | null
                    difficulty?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            game_sessions: {
                Row: {
                    id: string
                    nickname: string | null
                    status: 'active' | 'finished' | 'expired'
                    max_questions: number
                    time_limit_sec: number
                    seed: string
                    questions: QuestionItem[]
                    current_index: number
                    started_at: string
                    expires_at: string
                    finished_at: string | null
                    total_score: number
                    correct_count: number
                    total_time_ms: number
                    submit_token: string
                    client_ip: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    nickname?: string | null
                    status?: 'active' | 'finished' | 'expired'
                    max_questions?: number
                    time_limit_sec?: number
                    seed: string
                    questions: QuestionItem[]
                    current_index?: number
                    started_at?: string
                    expires_at: string
                    finished_at?: string | null
                    total_score?: number
                    correct_count?: number
                    total_time_ms?: number
                    submit_token: string
                    client_ip?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    nickname?: string | null
                    status?: 'active' | 'finished' | 'expired'
                    max_questions?: number
                    time_limit_sec?: number
                    seed?: string
                    questions?: QuestionItem[]
                    current_index?: number
                    started_at?: string
                    expires_at?: string
                    finished_at?: string | null
                    total_score?: number
                    correct_count?: number
                    total_time_ms?: number
                    submit_token?: string
                    client_ip?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
            }
            game_answers: {
                Row: {
                    id: string
                    session_id: string
                    question_index: number
                    chosen_index: number
                    is_correct: boolean
                    answer_time_ms: number
                    score: number
                    answered_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    question_index: number
                    chosen_index: number
                    is_correct: boolean
                    answer_time_ms: number
                    score?: number
                    answered_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    question_index?: number
                    chosen_index?: number
                    is_correct?: boolean
                    answer_time_ms?: number
                    score?: number
                    answered_at?: string
                }
            }
            leaderboard_entries: {
                Row: {
                    id: string
                    session_id: string
                    nickname: string
                    total_score: number
                    correct_count: number
                    total_time_ms: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    nickname?: string
                    total_score: number
                    correct_count: number
                    total_time_ms: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    nickname?: string
                    total_score?: number
                    correct_count?: number
                    total_time_ms?: number
                    created_at?: string
                }
            }
        }
    }
}

// Question item in game_sessions.questions JSONB
export interface QuestionItem {
    q: number
    song_id: string
    options: string[]  // 4 song IDs
    correct_index: number  // 0-3
}

// Song with title for display
export interface SongWithTitle {
    id: string
    title_zh: string
    youtube_video_id: string
    start_sec: number
}

// Type aliases for convenience
export type GameSession = Database['public']['Tables']['game_sessions']['Row']
export type Song = Database['public']['Tables']['songs']['Row']
export type GameAnswer = Database['public']['Tables']['game_answers']['Row']
export type LeaderboardEntry = Database['public']['Tables']['leaderboard_entries']['Row']

