import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export const createClient = () => {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          instrument: string | null
          user_type: 'student' | 'teacher'
          subscription_status: 'free' | 'premium'
          onboarding_complete: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          instrument?: string | null
          user_type?: 'student' | 'teacher'
          subscription_status?: 'free' | 'premium'
          onboarding_complete?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          instrument?: string | null
          user_type?: 'student' | 'teacher'
          subscription_status?: 'free' | 'premium'
          onboarding_complete?: boolean
        }
      }
      songs: {
        Row: {
          id: string
          user_id: string
          title: string
          artist: string | null
          color: string
          notes: string | null
          metronome_bpm: number
          position: number
          created_at: string
        }
        Insert: {
          user_id: string
          title: string
          artist?: string | null
          color?: string
          notes?: string | null
          metronome_bpm?: number
          position?: number
        }
        Update: {
          title?: string
          artist?: string | null
          color?: string
          notes?: string | null
          metronome_bpm?: number
          position?: number
        }
      }
      practice_sessions: {
        Row: {
          id: string
          user_id: string
          song_id: string
          duration_minutes: number
          notes: string | null
          start_time: string | null
          end_time: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          song_id: string
          duration_minutes: number
          notes?: string | null
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          duration_minutes?: number
          notes?: string | null
        }
      }
      teacher_shares: {
        Row: {
          id: string
          student_id: string
          token: string
          teacher_name: string | null
          is_active: boolean
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          student_id: string
          token?: string
          teacher_name?: string | null
          is_active?: boolean
        }
        Update: {
          is_active?: boolean
          revoked_at?: string | null
          teacher_name?: string | null
        }
      }
    }
  }
}