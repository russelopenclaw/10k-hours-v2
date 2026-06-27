'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, Share2, BarChart3, Music, Flame, Check, Headphones } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Clock,
    title: 'Simple Practice Timer',
    description: 'Start, pause, stop. Your practice time is automatically tracked per song.'
  },
  {
    icon: Share2,
    title: 'Share with Your Teacher',
    description: 'Generate a magic link — your teacher gets a read-only view of your progress. No sign-up required.'
  },
  {
    icon: BarChart3,
    title: 'Track Your Progress',
    description: 'See your practice streaks, time per song, and session history at a glance.'
  },
  {
    icon: Flame,
    title: 'Build a Streak',
    description: 'Stay motivated with daily practice streaks. Consistency beats duration.'
  },
  {
    icon: Music,
    title: 'Organize Your Songs',
    description: 'Keep all your practice pieces in one place. Add notes, set tempos, track time per piece.'
  },
  {
    icon: Headphones,
    title: 'Built-in Metronome',
    description: 'Stay in time with a customizable metronome — right inside your practice session.'
  },
]

const steps = [
  { step: '1', text: 'Create your free account' },
  { step: '2', text: 'Add your songs and start the timer' },
  { step: '3', text: 'Share a link with your teacher' },
]

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
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

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0F1115]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/cadent-logo-sm.png" alt="Cadent" className="h-8 w-8" />
            <span className="text-xl font-bold text-[#F5F7FA]">Cadent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[#9CA3AF] hover:text-[#F5F7FA]">Sign In</Button>
            </Link>
            <Link href="/login?mode=signup">
              <Button size="sm" className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center relative">
        {/* Subtle radial glow behind hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22D3EE]/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-[#22D3EE]/[0.08] text-[#22D3EE] px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-[#22D3EE]/10">
            <Flame className="h-4 w-4" />
            Track your practice. Share with your teacher.
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F5F7FA] tracking-tight mb-6 leading-[1.1]">
            Show your teacher what<br />
            <span className="text-[#22D3EE]">you&apos;ve been practicing</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-12 leading-relaxed">
            No more forgotten practice logs. Cadent tracks your music practice time 
            and lets you share progress with your teacher through a simple link — 
            no app download required for them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login?mode=signup">
              <Button size="lg" className="gap-2 w-full sm:w-auto bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] text-base h-11 glow-primary glow-primary-hover">
                Start Practicing Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-white/[0.15] h-11 text-base">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-sm text-[#6B7280] mt-5">Free forever for students. No credit card required.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-white/[0.06] py-20 bg-[#181B22]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] text-center mb-14">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(({ step, text }, i) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-[#22D3EE]/[0.08] border border-[#22D3EE]/20 text-[#22D3EE] rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <p className="text-[#F5F7FA] font-medium">{text}</p>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block mt-4 text-[#22D3EE]/30">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] text-center mb-4">
          Everything you need to build better practice habits
        </h2>
        <p className="text-[#9CA3AF] text-center mb-14 max-w-lg mx-auto">
          Simple, focused tools that stay out of your way so you can focus on what matters — playing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[#181B22] rounded-2xl border border-white/[0.06] p-6 hover:border-[#22D3EE]/20 transition-all duration-300 group">
              <div className="w-10 h-10 bg-[#22D3EE]/[0.08] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#22D3EE]/[0.12] transition-colors">
                <Icon className="h-5 w-5 text-[#22D3EE]" />
              </div>
              <h3 className="font-semibold text-[#F5F7FA] mb-2">{title}</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teacher CTA */}
      <section className="bg-[#22D3EE]/[0.04] border-y border-[#22D3EE]/10 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#22D3EE]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-4">
            For Music Teachers
          </h2>
          <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Your students share a link — you see their practice history, streaks, and song progress. 
            No account needed. No app to download. Just click and see.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-2.5">
              <Check className="h-5 w-5 text-[#22D3EE] shrink-0 mt-0.5" />
              <span className="text-sm text-[#F5F7FA]">See practice streaks</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="h-5 w-5 text-[#22D3EE] shrink-0 mt-0.5" />
              <span className="text-sm text-[#F5F7FA]">Track time per song</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="h-5 w-5 text-[#22D3EE] shrink-0 mt-0.5" />
              <span className="text-sm text-[#F5F7FA]">No sign-up needed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-4">
          Start your practice streak today
        </h2>
        <p className="text-[#9CA3AF] mb-8">
          It takes less than a minute to set up.
        </p>
        <Link href="/login?mode=signup">
          <Button size="lg" className="bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover text-base h-11">
            Get Started Free
          </Button>
        </Link>
        <p className="text-sm text-[#6B7280] mt-6">Every practice counts.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <img src="/cadent-logo-32.png" alt="Cadent" className="h-4 w-4" />
            <span className="text-sm font-medium">Cadent</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
            <span>© {new Date().getFullYear()} Cadent</span>
            <a href="/privacy" className="hover:text-[#F5F7FA] transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-[#F5F7FA] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}