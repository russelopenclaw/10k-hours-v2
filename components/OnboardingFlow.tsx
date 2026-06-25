'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Music, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { validateUsername } from '@/lib/gamification'

const INSTRUMENTS = [
  'Piano', 'Guitar', 'Violin', 'Drums', 'Bass', 'Voice',
  'Flute', 'Clarinet', 'Saxophone', 'Trumpet', 'Cello', 'Ukulele',
]

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [instrument, setInstrument] = useState('')
  const [customInstrument, setCustomInstrument] = useState('')
  const [firstSong, setFirstSong] = useState('')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  const selectedInstrument = instrument === 'Other' ? customInstrument : instrument

  const handleNameNext = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Please enter your name')
      return
    }
    // Validate the name as if it were a username (profanity filter)
    const validation = validateUsername(trimmed)
    if (!validation.valid) {
      setNameError(validation.reason || 'That name isn\'t available')
      return
    }
    setNameError('')
    setStep(2)
  }

  const handleAddSong = async () => {
    if (!user || !firstSong.trim()) {
      await completeOnboarding()
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('songs')
        .insert({
          user_id: user.id,
          title: firstSong.trim(),
          color: '#22D3EE',
        })

      if (error) throw error
      await completeOnboarding()
    } catch (err) {
      console.error('Error adding first song:', err)
      await completeOnboarding()
    } finally {
      setSaving(false)
    }
  }

  const completeOnboarding = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim() || null,
          display_name: name.trim() || null,
          instrument: selectedInstrument || null,
          onboarding_complete: true,
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
      <div className="w-16 h-16 bg-[#22D3EE]/[0.08] rounded-2xl flex items-center justify-center mx-auto border border-[#22D3EE]/20">
        <Music className="h-8 w-8 text-[#22D3EE]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#F5F7FA]">Welcome to Cadent 🎵</h2>
        <p className="text-[#9CA3AF] mt-2">
          Let's set up your practice space. This takes less than 30 seconds.
        </p>
      </div>
      <Button onClick={() => setStep(1)} size="lg" className="gap-2 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover">
        Let's Get Started
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,

    // Step 1: What's your name?
    <div key="name" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F5F7FA]">What should we call you?</h2>
        <p className="text-[#9CA3AF] mt-1">Your name will show up when you share progress with your teacher</p>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError('') }}
          className={`text-base bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40 ${nameError ? 'border-red-500/50' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameNext()
          }}
          autoFocus
        />
        {nameError && (
          <p className="text-sm text-red-400">{nameError}</p>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(0)} className="gap-2 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleNameNext}
          disabled={!name.trim()}
          className="gap-2 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,

    // Step 2: What instrument do you play?
    <div key="instrument" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F5F7FA]">What instrument do you play?</h2>
        <p className="text-[#9CA3AF] mt-1">Pick one — you can always add more later</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst}
            onClick={() => setInstrument(inst)}
            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
              instrument === inst
                ? 'border-[#22D3EE]/40 bg-[#22D3EE]/[0.08] text-[#22D3EE]'
                : 'border-white/[0.06] text-[#9CA3AF] hover:border-white/[0.12] hover:text-[#F5F7FA]'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <button
          onClick={() => setInstrument('Other')}
          className={`p-3 rounded-xl border text-sm font-medium transition-all w-full ${
            instrument === 'Other'
              ? 'border-[#22D3EE]/40 bg-[#22D3EE]/[0.08] text-[#22D3EE]'
              : 'border-white/[0.06] text-[#9CA3AF] hover:border-white/[0.12] hover:text-[#F5F7FA]'
          }`}
        >
          Other
        </button>
        {instrument === 'Other' && (
          <Input
            placeholder="What instrument?"
            value={customInstrument}
            onChange={(e) => setCustomInstrument(e.target.value)}
            className="text-base bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40"
          />
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)} className="gap-2 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={!selectedInstrument}
          className="gap-2 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,

    // Step 3: Add your first song
    <div key="song" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#F5F7FA]">Add your first song</h2>
        <p className="text-[#9CA3AF] mt-1">
          What are you working on right now?
        </p>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="e.g., Moonlight Sonata, Stairway to Heaven..."
          value={firstSong}
          onChange={(e) => setFirstSong(e.target.value)}
          className="text-base bg-[#0F1115] border-white/[0.06] text-[#F5F7FA] placeholder:text-[#6B7280] focus-visible:border-[#22D3EE]/40"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddSong()
          }}
        />
        <p className="text-xs text-[#6B7280] text-center">
          You can skip this and add songs later
        </p>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)} className="gap-2 border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleAddSong}
          disabled={saving}
          className="gap-2 bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover"
        >
          {saving ? 'Saving...' : firstSong.trim() ? 'Add Song & Start' : 'Skip & Start'}
          {!saving && <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#22D3EE]/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <Card className="w-full max-w-lg bg-[#181B22] border-white/[0.06] card-elevated relative">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-[#22D3EE]' : 'bg-white/[0.06]'
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