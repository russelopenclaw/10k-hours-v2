'use client'

import { useAuth } from '@/components/AuthProvider'
import AuthForm from '@/components/AuthForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      // Use window.location for guaranteed redirect after full page navigation.
      // Next.js router.replace() may not work reliably when the page is loaded
      // via a fresh navigation (page.goto) rather than a client-side transition,
      // because the Next.js router hasn't fully initialized yet.
      window.location.href = '/app'
    }
  }, [user, loading])

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