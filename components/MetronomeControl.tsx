'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Play, Pause, Settings, Volume2, Loader2 } from 'lucide-react'
import useMetronome, { MetronomeSettings } from '@/hooks/useMetronome'
import useDebouncedSlider from '@/hooks/useDebouncedSlider'

interface MetronomeControlProps {
  initialBpm?: number
  onSettingsChange?: (settings: MetronomeSettings) => void
  onSave?: (settings: MetronomeSettings) => void
  className?: string
}

export default function MetronomeControl({
  initialBpm = 120,
  onSettingsChange,
  onSave,
  className = ''
}: MetronomeControlProps) {
  const { isPlaying, settings, toggle, updateSettings } = useMetronome()
  const [showSettings, setShowSettings] = useState(false)

  useState(() => {
    if (initialBpm !== settings.bpm) {
      updateSettings({ bpm: initialBpm })
    }
  })

  const bpmSlider = useDebouncedSlider<number>({
    initialValue: settings.bpm,
    onSave: (value) => {
      handleBpmSave(value)
      if (onSave) onSave({ ...settings, bpm: value })
    }
  })

  const volumeSlider = useDebouncedSlider<number>({
    initialValue: settings.volume * 100,
    onSave: (value) => {
      handleVolumeSave(value)
      if (onSave) onSave({ ...settings, volume: value / 100 })
    }
  })

  const handleSettingsUpdate = (newSettings: Partial<MetronomeSettings>) => {
    updateSettings(newSettings)
    onSettingsChange?.({ ...settings, ...newSettings })

    if (!('bpm' in newSettings) && !('volume' in newSettings)) {
      if (onSave) {
        onSave({ ...settings, ...newSettings })
      }
    }
  }

  const handleBpmSave = useCallback((newBpm: number) => {
    updateSettings({ bpm: newBpm })
    if (onSettingsChange) {
      onSettingsChange({ ...settings, bpm: newBpm })
    }
  }, [settings, updateSettings, onSettingsChange])

  const handleVolumeSave = useCallback((newVolumePercent: number) => {
    const newVolume = newVolumePercent / 100
    updateSettings({ volume: newVolume })
    if (onSettingsChange) {
      onSettingsChange({ ...settings, volume: newVolume })
    }
  }, [settings, updateSettings, onSettingsChange])

  return (
    <Card className={className}>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center justify-between text-lg sm:text-xl text-[#F5F7FA]">
          <span className="font-bold">Metronome</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-[#9CA3AF] hover:text-[#F5F7FA]"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
        {/* BPM Display and Control */}
        <div className="text-center space-y-4">
          <div className="py-2">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#22D3EE] mb-1">
              {settings.bpm}
            </div>
            <div className="text-sm sm:text-base text-[#9CA3AF] font-medium">
              BPM
            </div>
          </div>

          <Button
            onClick={toggle}
            className={`w-full font-semibold h-11 ${
              isPlaying
                ? 'bg-[#F59E0B]/[0.1] text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/20'
                : 'bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9] glow-primary glow-primary-hover'
            }`}
            size="lg"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                <span>Stop Metronome</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                <span>Start Metronome</span>
              </>
            )}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4 sm:space-y-5 pt-4 border-t border-white/[0.06]">
            {/* Tempo Control */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium text-[#9CA3AF]">Tempo</Label>
              <div className="px-2">
                <Slider
                  value={[bpmSlider.value]}
                  onValueChange={(value) => bpmSlider.handlers.onChange(typeof value === 'number' ? value : value[0])}
                  onMouseDown={() => bpmSlider.handlers.onStart()}
                  onTouchStart={() => bpmSlider.handlers.onStart()}
                  onMouseUp={() => bpmSlider.handlers.onEnd()}
                  onTouchEnd={() => bpmSlider.handlers.onEnd()}
                  min={40}
                  max={200}
                  step={1}
                  className="w-full"
                />
                {bpmSlider.isPending && !bpmSlider.isInteracting && (
                  <div className="flex justify-end mt-1">
                    <Loader2 className="h-3 w-3 text-[#22D3EE] animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-[#6B7280] px-2">
                <span>40 BPM</span>
                <span>200 BPM</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium text-[#9CA3AF] flex items-center">
                <Volume2 className="h-4 w-4 mr-2" />
                Volume
              </Label>
              <div className="px-2">
                <Slider
                  value={[volumeSlider.value]}
                  onValueChange={(value) => volumeSlider.handlers.onChange(typeof value === 'number' ? value : value[0])}
                  onMouseDown={() => volumeSlider.handlers.onStart()}
                  onTouchStart={() => volumeSlider.handlers.onStart()}
                  onMouseUp={() => volumeSlider.handlers.onEnd()}
                  onTouchEnd={() => volumeSlider.handlers.onEnd()}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                {volumeSlider.isPending && !volumeSlider.isInteracting && (
                  <div className="flex justify-end mt-1">
                    <Loader2 className="h-3 w-3 text-[#22D3EE] animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-[#6B7280] px-2">
                <span>0%</span>
                <span>{Math.round(settings.volume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Sound Selection */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium text-[#9CA3AF]">Sound</Label>
              <Select
                value={settings.sound}
                onValueChange={(value) =>
                  handleSettingsUpdate({ sound: value as MetronomeSettings['sound'] })
                }
              >
                <SelectTrigger className="w-full bg-[#0F1115] border-white/[0.06] text-[#F5F7FA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#181B22] border-white/[0.06]">
                  <SelectItem value="click">Click</SelectItem>
                  <SelectItem value="beep">Beep</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Signature */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium text-[#9CA3AF]">Time Signature</Label>
              <Select
                value={settings.timeSignature.toString()}
                onValueChange={(value) =>
                  handleSettingsUpdate({ timeSignature: parseInt(value ?? '4') })
                }
              >
                <SelectTrigger className="w-full bg-[#0F1115] border-white/[0.06] text-[#F5F7FA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#181B22] border-white/[0.06]">
                  <SelectItem value="2">2/4</SelectItem>
                  <SelectItem value="3">3/4</SelectItem>
                  <SelectItem value="4">4/4</SelectItem>
                  <SelectItem value="6">6/8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Accent Toggle */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm sm:text-base font-medium text-[#9CA3AF]">Accent First Beat</Label>
              <Button
                className={`min-w-[60px] ${
                  settings.accent
                    ? 'bg-[#22D3EE] text-[#0F1115] hover:bg-[#67E8F9]'
                    : 'border-white/[0.08] text-[#9CA3AF] hover:text-[#F5F7FA]'
                }`}
                variant={settings.accent ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSettingsUpdate({ accent: !settings.accent })}
              >
                {settings.accent ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}