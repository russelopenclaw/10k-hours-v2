'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Share2, Check, Eye, EyeOff, Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push('/app')
      }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if we have a valid session
  const hasSession = searchParams.get('code') || searchParams.get('token_hash')

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#181B22] border-white/[0.06]">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-[#22D3EE]/[0.08] rounded-xl flex items-center justify-center mx-auto mb-2">
              <Share2 className="h-6 w-6 text-[#22D3EE]" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#F5F7FA]">Cadent</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-[#EF4444] text-sm">No valid session found. Please request a new password reset link.</p>
            <Button className="w-full bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9]" onClick={() => router.push('/')}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#181B22] border-white/[0.06]">
          <CardContent className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-[#34D399]/[0.1] rounded-2xl flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-[#34D399]" />
            </div>
            <h2 className="text-2xl font-bold text-[#F5F7FA]">Password Reset!</h2>
            <p className="text-[#9CA3AF]">Your password has been updated. Redirecting to the app...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#181B22] border-white/[0.06]">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#22D3EE]/[0.08] rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-[#22D3EE]" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#F5F7FA]">Cadent</CardTitle>
          </div>
          <p className="text-sm text-[#9CA3AF]">Set your new password</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-[#9CA3AF]">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 characters minimum"
                  className="bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#9CA3AF]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#9CA3AF]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40"
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="bg-[#EF4444]/[0.08] border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}