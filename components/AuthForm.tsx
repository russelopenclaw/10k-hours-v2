'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Flame, ArrowLeft, Mail, Lock, User, Share2, Music } from 'lucide-react'
import Link from 'next/link'

export default function AuthForm() {
  const { signIn, signUp } = useAuth()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [isTeacher, setIsTeacher] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSignupSuccess(false)
    try {
      await signUp(email, password, fullName, isTeacher ? 'teacher' : 'student')
      // If signUp succeeds without throwing, the confirmation email was sent
      // (Supabase doesn't auto-login when email confirm is enabled)
      setSignupSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (resetError) throw resetError
      setResetSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password reset flow
  if (showReset) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex">
        {/* Left panel - branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#181B22] items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#22D3EE]/[0.04] rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-md text-[#F5F7FA] relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
                <img src="/cadent-logo-sm.png" alt="Cadent" className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold">Cadent</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Forgot your password?</h2>
            <p className="text-[#9CA3AF] text-lg leading-relaxed">
              No worries! Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div className="mt-12 flex items-center gap-3 text-[#9CA3AF]">
              <Flame className="h-5 w-5 text-[#22D3EE]" />
              <span>Consistency beats duration</span>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            {resetSent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-[#34D399]/[0.1] rounded-2xl flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-[#34D399]" />
                </div>
                <h2 className="text-2xl font-bold text-[#F5F7FA]">Check your email</h2>
                <p className="text-[#9CA3AF]">
                  We sent a password reset link to <strong className="text-[#F5F7FA]">{email}</strong>
                </p>
                <Button
                  variant="outline"
                  className="w-full border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-white/[0.15]"
                  onClick={() => { setShowReset(false); setResetSent(false) }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Link href="/" className="inline-flex items-center gap-2 text-[#22D3EE] hover:text-[#67E8F9] mb-6 text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </Link>
                  <h1 className="text-2xl font-bold text-[#F5F7FA] mt-4">Reset your password</h1>
                  <p className="text-[#9CA3AF] mt-2">Enter your email and we&apos;ll send you a reset link</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-sm font-medium text-[#9CA3AF]">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                      <Input
                        id="resetEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10 h-11 bg-[#181B22] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:ring-[#22D3EE]/20"
                        required
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="bg-[#EF4444]/[0.08] border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-11 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover text-base font-medium" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="text-sm text-[#22D3EE] hover:text-[#67E8F9]"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main sign in / sign up flow
  return (
    <div className="min-h-screen bg-[#0F1115] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#181B22] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#22D3EE]/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-md text-[#F5F7FA] relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <img src="/cadent-logo-sm.png" alt="Cadent" className="h-6 w-6" />
            </div>
            <span className="text-3xl font-bold">Cadent</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {mode === 'signin' ? 'Welcome back' : 'Start your journey'}
          </h2>
          <p className="text-[#9CA3AF] text-lg leading-relaxed mb-8">
            {mode === 'signin' 
              ? 'Your practice streak is waiting. Sign in to pick up where you left off.'
              : 'Join musicians tracking their practice and sharing progress with teachers.'}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3">
              <Clock className="h-5 w-5 text-[#22D3EE] shrink-0" />
              <span className="text-[#9CA3AF]">Track every practice minute</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3">
              <Share2 className="h-5 w-5 text-[#22D3EE] shrink-0" />
              <span className="text-[#9CA3AF]">Share progress with your teacher</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3">
              <Flame className="h-5 w-5 text-[#22D3EE] shrink-0" />
              <span className="text-[#9CA3AF]">Build daily practice streaks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src="/cadent-logo-sm.png" alt="Cadent" className="h-8 w-8" />
            <span className="text-2xl font-bold text-[#F5F7FA]">Cadent</span>
          </div>

          {/* Mode toggle */}
          <div className="bg-[#181B22] rounded-xl p-1 flex mb-8 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError('') }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-[#22D3EE]/[0.1] text-[#22D3EE]'
                  : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-[#22D3EE]/[0.1] text-[#22D3EE]'
                  : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'signin' ? (
            <>
              <h1 className="text-2xl font-bold text-[#F5F7FA] mb-2">Sign in to your account</h1>
              <p className="text-[#9CA3AF] mb-8">Welcome back! Enter your credentials to continue.</p>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-[#9CA3AF]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-11 bg-[#181B22] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:ring-[#22D3EE]/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-[#9CA3AF]">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setError('') }}
                      className="text-xs text-[#22D3EE] hover:text-[#67E8F9]"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 h-11 bg-[#181B22] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:ring-[#22D3EE]/20"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-[#EF4444]/[0.08] border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full h-11 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover text-base font-medium" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </>
          ) : signupSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-[#34D399]/[0.1] rounded-2xl flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-[#34D399]" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F7FA]">Check your email</h2>
              <p className="text-[#9CA3AF]">
                We sent a confirmation link to <strong className="text-[#F5F7FA]">{email}</strong>.
                Click it to verify your account and start practicing.
              </p>
              <p className="text-sm text-[#6B7280]">
                Didn&apos;t get the email? Check your spam folder.
              </p>
              <Button
                variant="outline"
                className="w-full border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-white/[0.15]"
                onClick={() => { setMode('signin'); setSignupSuccess(false); setError('') }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#F5F7FA] mb-2">Create your free account</h1>
              <p className="text-[#9CA3AF] mb-8">Start tracking your practice in under a minute.</p>

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-[#9CA3AF]">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="pl-10 h-11 bg-[#181B22] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:ring-[#22D3EE]/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail" className="text-sm font-medium text-[#9CA3AF]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      id="signupEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-11 bg-[#181B22] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:ring-[#22D3EE]/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword" className="text-sm font-medium text-[#9CA3AF]">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      id="signupPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 characters minimum"
                      className="pl-10 h-11 bg-[#181B22] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 focus-visible:ring-[#22D3EE]/20"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-[#EF4444]/[0.08] border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {/* Teacher toggle */}
                <div className="flex items-center gap-3 bg-[#181B22] border border-white/[0.06] rounded-xl px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setIsTeacher(!isTeacher)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${isTeacher ? 'bg-[#22D3EE]' : 'bg-[#27272a]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isTeacher ? 'translate-x-5' : ''}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-[#F5F7FA]">I&apos;m a teacher</p>
                    <p className="text-xs text-[#6B7280]">Get a dashboard to view all your students&apos; progress</p>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover text-base font-medium" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </>
          )}

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-[#9CA3AF]">
            {mode === 'signin' ? (
              <>Don&apos;t have an account?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError('') }} className="text-[#22D3EE] hover:text-[#67E8F9] font-medium">
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError('') }} className="text-[#22D3EE] hover:text-[#67E8F9] font-medium">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}