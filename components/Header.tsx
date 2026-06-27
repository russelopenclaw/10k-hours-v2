'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, UserCheck, HelpCircle, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/lib/supabase'
import DayStreakAchievement from '@/components/DayStreakAchievement'
import CoinBalance from '@/components/CoinBalance'
import UserMenu from '@/components/UserMenu'
import ShareWithTeacher from '@/components/ShareWithTeacher'

type Profile = Database['public']['Tables']['profiles']['Row']

interface HeaderProps {
  profile: Profile | null
  userEmail: string | undefined
  accessToken: string | null
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
  accessToken,
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
          {/* Desktop: single row */}
          <div className="hidden sm:flex items-center justify-between h-16">
            {/* Left: App Title + Streak + Points + Leaderboard */}
            <div className="flex items-center gap-3 min-w-0 shrink">
              <img src="/cadent-logo-sm.png" alt="Cadent" className="h-8 w-8 shrink-0" />
              <h1 className="text-lg font-bold text-[#F5F7FA] shrink-0">Cadent</h1>
              <DayStreakAchievement />
              <CoinBalance />
              <Link href="/app/leaderboard" className="text-[#9CA3AF] hover:text-[#F59E0B] transition-colors" title="Leader Board">
                <Trophy className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {sharedWithTeacher ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareClick || (() => setShowShare(true))}
                  className="gap-2 border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/40"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Sharing with {sharedWithTeacher}</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareClick || (() => setShowShare(true))}
                  className="gap-2 border-white/[0.06] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-[#22D3EE]/20"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share with Teacher</span>
                </Button>
              )}

              <Link href="/app/help" className="text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors">
                <HelpCircle className="h-5 w-5" />
              </Link>

              <UserMenu
                profile={profile}
                userEmail={userEmail}
                accessToken={accessToken}
                onUpdatePassword={onUpdatePassword}
                onUpdateEmail={onUpdateEmail}
                onUpdateDisplayName={onUpdateDisplayName}
                onSignOut={onSignOut}
              />
            </div>
          </div>

          {/* Mobile: two rows */}
          <div className="sm:hidden">
            {/* Row 1: Logo + Help + User menu */}
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <img src="/cadent-logo-sm.png" alt="Cadent" className="h-8 w-8" />
                <h1 className="text-lg font-bold text-[#F5F7FA]">Cadent</h1>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/app/help" className="text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors p-1">
                  <HelpCircle className="h-5 w-5" />
                </Link>
                <UserMenu
                  profile={profile}
                  userEmail={userEmail}
                  accessToken={accessToken}
                  onUpdatePassword={onUpdatePassword}
                  onUpdateEmail={onUpdateEmail}
                  onUpdateDisplayName={onUpdateDisplayName}
                  onSignOut={onSignOut}
                />
              </div>
            </div>

            {/* Row 2: Streak + Points + Leaderboard + Share button */}
            <div className="flex items-center justify-between h-10 -mt-1 pb-1">
              <div className="flex items-center gap-2">
                <DayStreakAchievement />
                <CoinBalance />
                <Link href="/app/leaderboard" className="text-[#9CA3AF] hover:text-[#F59E0B] transition-colors p-1" title="Leader Board">
                  <Trophy className="h-4 w-4" />
                </Link>
              </div>

              {sharedWithTeacher ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareClick || (() => setShowShare(true))}
                  className="gap-2 border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/40"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Sharing</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShareClick || (() => setShowShare(true))}
                  className="gap-2 border-white/[0.06] text-[#9CA3AF] hover:text-[#F5F7FA] hover:border-[#22D3EE]/20"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              )}
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