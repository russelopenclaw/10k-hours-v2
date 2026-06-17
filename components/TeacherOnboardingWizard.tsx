'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Check } from 'lucide-react'

interface TeacherOnboardingWizardProps {
  onComplete: () => void
}

export default function TeacherOnboardingWizard({ onComplete }: TeacherOnboardingWizardProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [addLink, setAddLink] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [studentAdded, setStudentAdded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  const handleAddStudent = async () => {
    if (!user || !addLink.trim()) return
    setAdding(true)
    setAddError('')

    try {
      const input = addLink.trim()
      let shortCode: string | undefined
      let token: string | undefined

      if (input.startsWith('CAD-')) {
        shortCode = input.toUpperCase()
      } else if (input.match(/\/share\//)) {
        const tokenMatch = input.match(/\/share\/([a-zA-Z0-9-]+)/)
        if (!tokenMatch) {
          setAddError('Invalid link. Paste the share code or link your student gave you.')
          setAdding(false)
          return
        }
        const extracted = tokenMatch[1]
        if (extracted.startsWith('CAD-')) {
          shortCode = extracted.toUpperCase()
        } else {
          token = extracted
        }
      } else {
        setAddError('Enter a share code (e.g. CAD-4X7K) or the full share link.')
        setAdding(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setAddError('You must be logged in.')
        setAdding(false)
        return
      }

      const res = await fetch('/api/teacher/add-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ token, shortCode })
      })

      const data = await res.json()

      if (!res.ok) {
        setAddError(data.error || 'Something went wrong.')
        setAdding(false)
        return
      }

      setStudentAdded(true)
      setAddLink('')

      // Auto-advance after 1.5s
      setTimeout(() => {
        setStep(2)
      }, 1500)
    } catch (err) {
      setAddError('Something went wrong. Please try again.')
      setAdding(false)
    }
  }

  const completeOnboarding = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim() || null,
          teacher_onboarded: true
        })
        .eq('id', user.id)

      if (error) throw error
    } catch (err) {
      console.error('Error updating profile:', err)
    }

    onComplete()
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

    // Step 1: What's your name?
    <div key="name" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F5F7FA]">What should we call you?</h2>
        <p className="text-[#9CA3AF] mt-1">Your students will see this name on their dashboard</p>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-base bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#5e6ad2]/40"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) setStep(2)
          }}
          autoFocus
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(0)} className="gap-2 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => setStep(2)}
          className="gap-2 bg-[#5e6ad2] text-white hover:bg-[#4f5bb5]"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,

    // Step 2: Add Your First Student
    <div key="add-student" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F5F7FA]">Add Your First Student</h2>
        <p className="text-[#9CA3AF] mt-1">
          Paste the share link your student gives you from their app.
        </p>
      </div>

      {studentAdded ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-[#22c55e]/[0.1] flex items-center justify-center">
            <Check className="h-6 w-6 text-[#22c55e]" />
          </div>
          <p className="text-[#22c55e] font-medium">Student added!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Input
              placeholder="CAD-4X7K or https://www.cadent.online/share/CAD-4X7K"
              value={addLink}
              onChange={(e) => { setAddLink(e.target.value); setAddError('') }}
              className="text-base bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#5e6ad2]/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddStudent()
              }}
            />
            {addError && (
              <p className="text-sm text-[#ef4444]">{addError}</p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep(3)}
                className="text-[#9CA3AF] hover:text-[#F5F7FA]"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!addLink.trim() || adding}
                className="gap-2 bg-[#5e6ad2] text-white hover:bg-[#4f5bb5]"
              >
                {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Student
              </Button>
            </div>
          </div>
        </>
      )}
    </div>,

    // Step 3: You're All Set!
    <div key="complete" className="text-center space-y-6">
      <div className="w-16 h-16 bg-[#22c55e]/[0.08] rounded-2xl flex items-center justify-center mx-auto border border-[#22c55e]/20">
        <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#F5F7FA]">You&apos;re Ready to Teach! 🎉</h2>
        <p className="text-[#9CA3AF] mt-2">
          You can always add more students from your dashboard. Upgrade to Teacher Pro for unlimited students, weekly digests, and assignments.
        </p>
      </div>
      <div className="space-y-3">
        <Button
          onClick={completeOnboarding}
          disabled={saving}
          size="lg"
          className="gap-2 bg-[#5e6ad2] text-white hover:bg-[#4f5bb5] w-full"
        >
          {saving ? 'Saving...' : 'Go to Dashboard'}
          {!saving && <ArrowRight className="h-4 w-4" />}
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
