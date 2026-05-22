'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, Share2, BarChart3, Music, Flame, Check } from 'lucide-react'
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
    description: 'Generate a magic link and your teacher gets a read-only view of your progress. No sign-up required for them.'
  },
  {
    icon: BarChart3,
    title: 'Track Your Progress',
    description: 'See your practice streaks, time per song, and session history at a glance.'
  },
  {
    icon: Flame,
    title: 'Build a Streak',
    description: 'Stay motivated with daily practice streaks. Consistent practice beats long practice.'
  },
  {
    icon: Music,
    title: 'Organize Your Songs',
    description: 'Keep all your practice pieces in one place. Add notes, set tempos, track time per piece.'
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Logged-in users redirect to /app
  if (user) {
    return null
  }

  // Not logged in — show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Cadent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login?mode=signup">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <Flame className="h-4 w-4" />
          Track your practice. Share with your teacher.
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
          Show your teacher what you&apos;ve been practicing
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          No more forgotten practice logs. Cadent tracks your music practice time 
          and lets you share your progress with your teacher through a simple link — 
          no app download required for them.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login?mode=signup">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Start Practicing Free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">Free forever for students. No credit card required.</p>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(({ step, text }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <p className="text-gray-700 font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
          Everything you need to build better practice habits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teacher CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            For Music Teachers
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Your students share a link — you see their practice history, streaks, and song progress. 
            No account needed. No app to download. Just click and see.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-blue-200 shrink-0 mt-0.5" />
              <span className="text-sm">See practice streaks</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-blue-200 shrink-0 mt-0.5" />
              <span className="text-sm">Track time per song</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-blue-200 shrink-0 mt-0.5" />
              <span className="text-sm">No sign-up needed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Start your practice streak today
        </h2>
        <p className="text-gray-600 mb-8">
          It takes less than a minute to set up.
        </p>
        <Link href="/login?mode=signup">
          <Button size="lg" className="gap-2">
            Get Started Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Cadent</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Cadent. Practice makes progress.
          </p>
        </div>
      </footer>
    </div>
  )
}