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
      router.push('/app')
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