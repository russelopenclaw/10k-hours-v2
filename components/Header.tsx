'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, UserCheck } from 'lucide-react'
import { Database } from '@/lib/supabase'
import DayStreakAchievement from '@/components/DayStreakAchievement'
import UserMenu from '@/components/UserMenu'
import ShareWithTeacher from '@/components/ShareWithTeacher'

type Profile = Database['public']['Tables']['profiles']['Row']

interface HeaderProps {
  profile: Profile | null
  userEmail: string | undefined
  onUpdatePassword: (password: string) => Promise<void>
  onUpdateEmail: (email: string) => Promise<void>
  onUpdateDisplayName: (name: string) => Promise<void>
  onSignOut: () => Promise<void>
  /** If provided, shows "Sharing with [name]" instead of "Share with Teacher" */
  sharedWithTeacher?: string | null
  /** Called when user clicks the share/teacher button */
  onShareClick?: () => void
}

export default function Header({
  profile,
  userEmail,
  onUpdatePassword,
  onUpdateEmail,
  onUpdateDisplayName,
  onSignOut,
  sharedWithTeacher,
  onShareClick,
}: HeaderProps) {
  const [showShare, setShowShare] = useState(false)

  return (
    <>
      <header className="bg-[#0F1115]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: App Title + Streak */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img src="/cadent-logo-sm.png" alt="Cadent" className="h-8 w-8" />
              <h1 className="text-lg font-bold text-[#F5F7FA]">Cadent</h1>
              <DayStreakAchievement />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {sharedWithTeacher ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareClick || (() => setShowShare(true))}
                  className="gap-2 border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/40"
                >
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Sharing with {sharedWithTeacher}</span>
                  <span className="sm:hidden">Sharing</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareClick || (() => setShowShare(true))}
                  className="gap-2 border-white/[0.06] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-[#22D3EE]/20"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share with Teacher</span>
                  <span className="sm:hidden">Share</span>
                </Button>
              )}

              <UserMenu
                profile={profile}
                userEmail={userEmail}
                onUpdatePassword={onUpdatePassword}
                onUpdateEmail={onUpdateEmail}
                onUpdateDisplayName={onUpdateDisplayName}
                onSignOut={onSignOut}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Share dialog — only rendered when opened from header */}
      {!onShareClick && (
        <ShareWithTeacher isOpen={showShare} onClose={() => setShowShare(false)} />
      )}
    </>
  )
}