import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export const createClient = () => {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
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
          display_name: string | null
          instrument: string | null
          user_type: 'student' | 'teacher'
          subscription_status: 'free' | 'premium'
          onboarding_complete: boolean
          teacher_onboarded: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          total_coins: number
          consent_status: 'not_required' | 'pending' | 'verified' | 'denied'
          parent_email: string | null
          leaderboard_visibility: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          display_name?: string | null
          instrument?: string | null
          user_type?: 'student' | 'teacher'
          subscription_status?: 'free' | 'premium'
          onboarding_complete?: boolean
          teacher_onboarded?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          total_coins?: number
          consent_status?: 'not_required' | 'pending' | 'verified' | 'denied'
          parent_email?: string | null
          leaderboard_visibility?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          display_name?: string | null
          instrument?: string | null
          user_type?: 'student' | 'teacher'
          subscription_status?: 'free' | 'premium'
          onboarding_complete?: boolean
          teacher_onboarded?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          total_coins?: number
          consent_status?: 'not_required' | 'pending' | 'verified' | 'denied'
          parent_email?: string | null
          leaderboard_visibility?: boolean
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
          coins_earned: number
          streak_multiplier: number
          created_at: string
        }
        Insert: {
          user_id: string
          song_id: string
          duration_minutes: number
          notes?: string | null
          start_time?: string | null
          end_time?: string | null
          coins_earned?: number
          streak_multiplier?: number
        }
        Update: {
          duration_minutes?: number
          notes?: string | null
          coins_earned?: number
          streak_multiplier?: number
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
      teacher_students: {
        Row: {
          id: string
          teacher_id: string
          student_id: string
          added_at: string
        }
        Insert: {
          teacher_id: string
          student_id: string
        }
        Update: {
        }
      }
      assignments: {
        Row: {
          id: string
          teacher_id: string
          student_id: string
          song_id: string | null
          title: string
          tempo: number | null
          goal: string | null
          status: 'assigned' | 'in_progress' | 'completed'
          notes: string | null
          created_at: string
          due_at: string | null
        }
        Insert: {
          teacher_id: string
          student_id: string
          song_id?: string | null
          title: string
          tempo?: number | null
          goal?: string | null
          status?: 'assigned' | 'in_progress' | 'completed'
          notes?: string | null
          due_at?: string | null
        }
        Update: {
          title?: string
          tempo?: number | null
          goal?: string | null
          status?: 'assigned' | 'in_progress' | 'completed'
          notes?: string | null
          due_at?: string | null
          song_id?: string | null
        }
      }
      content_reports: {
        Row: {
          id: string
          reporter_id: string
          content_type: 'assignment' | 'attachment' | 'display_name' | 'profile' | 'other'
          content_id: string
          reason: 'inappropriate' | 'offensive' | 'spam' | 'harassment' | 'other'
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          reporter_id: string
          content_type: 'assignment' | 'attachment' | 'display_name' | 'profile' | 'other'
          content_id: string
          reason: 'inappropriate' | 'offensive' | 'spam' | 'harassment' | 'other'
          description?: string | null
        }
        Update: {
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
    }
  }
}