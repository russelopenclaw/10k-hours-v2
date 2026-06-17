'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GraduationCap, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

interface TeacherOnboardingWizardProps {
  onComplete: () => void
}

export default function TeacherOnboardingWizard({ onComplete }: TeacherOnboardingWizardProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const completeOnboarding = async () => {
    if (!user || saving) return

    setSaving(true)
    setSaveError('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          teacher_onboarded: true
        })
        .eq('id', user.id)

      if (error) throw error

      onComplete()
    } catch (err) {
      console.error('Error completing onboarding:', err)
      setSaveError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6">
      <div className="w-16 h-16 bg-[#5e6ad2]/[0.08] rounded-2xl flex items-center justify-center mx-auto border border-[#5e6ad2]/20">
        <GraduationCap className="h-8 w-8 text-[#5e6ad2]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#F5F7FA]">Welcome to Cadent for Teachers 🎓</h2>
        <p className="text-[#9CA3AF] mt-2">
          Track your students&apos; practice, assign pieces, and see their progress. Let&apos;s get you set up.
        </p>
      </div>
      <Button onClick={() => setStep(1)} size="lg" className="gap-2 bg-[#5e6ad2] text-white hover:bg-[#4f5bb5]">
        Get Started
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,

    // Step 1: You're All Set!
    <div key="complete" className="text-center space-y-6">
      <div className="w-16 h-16 bg-[#22c55e]/[0.08] rounded-2xl flex items-center justify-center mx-auto border border-[#22c55e]/20">
        <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#F5F7FA]">You&apos;re Ready to Teach! 🎉</h2>
        <p className="text-[#9CA3AF] mt-2">
          Add students from your dashboard using their share codes. Upgrade to Teacher Pro for unlimited students, weekly digests, and assignments.
        </p>
      </div>
      {saveError && (
        <p className="text-sm text-[#ef4444]">{saveError}</p>
      )}
      <div className="space-y-3">
        <Button
          onClick={completeOnboarding}
          disabled={saving}
          size="lg"
          className="gap-2 bg-[#5e6ad2] text-white hover:bg-[#4f5bb5] w-full"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <>Go to Dashboard <ArrowRight className="h-4 w-4" /></>}
        </Button>
        <p className="text-xs text-[#6B7280]">
          <button
            onClick={completeOnboarding}
            className="text-[#5e6ad2] hover:text-[#4f5bb5] transition-colors"
          >
            Upgrade to Pro
          </button>
        </p>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#5e6ad2]/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <Card className="w-full max-w-lg bg-[#181B22] border-white/[0.06] card-elevated relative">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-[#5e6ad2]' : 'bg-white/[0.06]'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {steps[step]}
        </CardContent>
      </Card>
    </div>
  )
}