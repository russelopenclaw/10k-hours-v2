'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, userType?: 'student' | 'teacher') => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  getSession: () => Promise<Session | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Once auth and profile have resolved in this browser session,
// don't show the full-page spinner again (prevents back-button spinner).
// Uses sessionStorage to persist across full page navigations.
function markAuthLoaded(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('cadent-auth-loaded', '1')
  }
}

const supabase = createClient()

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Don't leave profile as null forever — retry once after 2s
        setTimeout(() => {
          supabase.from('profiles').select('*').eq('id', userId).single()
            .then((result: { data: Profile | null }) => { if (result.data) setProfile(result.data) })
            .catch(() => {})
        }, 2000)
        return
      }
      setProfile(data)
      markAuthLoaded()
    } catch (err) {
      console.error('Profile fetch exception:', err)
    }
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (cancelled) return

        if (error) {
          console.warn('Session error:', error.message)
          if (error.message.includes('refresh_token_not_found') ||
              error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
            setLoading(false)
            markAuthLoaded()
            return
          }
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        setLoading(false)
        markAuthLoaded()
      } catch (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        markAuthLoaded()
      }
    }

    // Safety timeout: never spin forever on auth loading
    const authTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('Auth session fetch timed out after 10s')
        setLoading(false)
        markAuthLoaded()
      }
    }, 10000)

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (cancelled) return
        try {
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
        } catch (err) {
          console.error('Auth state change error:', err)
        }
        setLoading(false)
        markAuthLoaded()
      }
    )

    // Handle bfcache restore: re-fetch session when page is restored from back/forward cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from bfcache — session may be stale
        // Force a fresh session check
        getSession()
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      cancelled = true
      clearTimeout(authTimeout)
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [supabase.auth, fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string, userType: 'student' | 'teacher' = 'student') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Explicitly redirect to login after sign out
    window.location.href = '/login'
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  const updateEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error
  }

  const updateDisplayName = async (name: string) => {
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id)
    if (error) throw error
    // Refresh profile in context — do NOT call updateUser (it triggers onAuthStateChange
    // which races with the Dialog and causes the modal to hang)
    await fetchProfile(user.id)
  }

  // Safe session getter with timeout — prevents hangs on suspended tabs
  const getSession = useCallback(async (): Promise<Session | null> => {
    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) console.warn('getSession timed out after 5s')
    }, 5000)
    try {
      const { data } = await supabase.auth.getSession()
      resolved = true
      return data.session
    } finally {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updatePassword, updateEmail, updateDisplayName, getSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}