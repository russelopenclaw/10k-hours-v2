'use client'

import { useAuth } from '@/components/AuthProvider'
import AuthForm from '@/components/AuthForm'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')

  useEffect(() => {
    if (user && !loading) {
      if (nextPath) {
        router.replace(nextPath)
      } else if (profile?.user_type === 'teacher') {
        router.replace('/app/teacher')
      } else {
        router.replace('/app')
      }
    }
  }, [user, profile, loading, router, nextPath])

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