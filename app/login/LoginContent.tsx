'use client'

import { useAuth } from '@/components/AuthProvider'
import AuthForm from '@/components/AuthForm'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Redirect logged-in users away from the login page.
    // Use a ref guard to prevent double-redirect in StrictMode.
    // This handles both: (1) user navigates to /login while already
    // logged in, and (2) user just completed sign-in on this page.
    if (user && !loading && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace('/app')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1115]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return <AuthForm />
}