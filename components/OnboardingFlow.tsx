'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, ArrowRight, ArrowLeft, Check } from 'lucide-react'

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

  const selectedInstrument = instrument === 'Other' ? customInstrument : instrument

  const handleAddSong = async () => {
    if (!user || !firstSong.trim()) {
      // Skip song if empty, just complete onboarding
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
          color: '#3b82f6', // Default blue
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
      // Update profile with instrument and onboarding completion
      await supabase
        .from('profiles')
        .update({
          instrument: selectedInstrument || null,
        })
        .eq('id', user.id)
    } catch (err) {
      console.error('Error updating profile:', err)
    }

    onComplete()
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Music className="h-8 w-8 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to Cadent! 🎵</h2>
        <p className="text-gray-600 mt-2">
          Let's set up your practice space. This takes less than 30 seconds.
        </p>
      </div>
      <Button onClick={() => setStep(1)} size="lg" className="gap-2">
        Let's Get Started
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,

    // Step 1: What instrument do you play?
    <div key="instrument" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">What instrument do you play?</h2>
        <p className="text-gray-600 mt-1">Pick one — you can always add more later</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst}
            onClick={() => setInstrument(inst)}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              instrument === inst
                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <button
          onClick={() => setInstrument('Other')}
          className={`p-3 rounded-lg border text-sm font-medium transition-all w-full ${
            instrument === 'Other'
              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          Other
        </button>
        {instrument === 'Other' && (
          <Input
            placeholder="What instrument?"
            value={customInstrument}
            onChange={(e) => setCustomInstrument(e.target.value)}
            className="text-base"
          />
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => setStep(2)}
          disabled={!selectedInstrument}
          className="gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,

    // Step 2: Add your first song
    <div key="song" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Add your first song</h2>
        <p className="text-gray-600 mt-1">
          What are you working on right now?
        </p>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="e.g., Moonlight Sonata, Stairway to Heaven..."
          value={firstSong}
          onChange={(e) => setFirstSong(e.target.value)}
          className="text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddSong()
          }}
        />
        <p className="text-xs text-gray-500 text-center">
          You can skip this and add songs later
        </p>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleAddSong}
          disabled={saving}
          className="gap-2"
        >
          {saving ? 'Saving...' : firstSong.trim() ? 'Add Song & Start' : 'Skip & Start'}
          {!saving && <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
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