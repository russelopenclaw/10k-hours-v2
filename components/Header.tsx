'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { Database } from '@/lib/supabase'
import DayStreakAchievement from '@/components/DayStreakAchievement'
import UserMenu from '@/components/UserMenu'

type Profile = Database['public']['Tables']['profiles']['Row']

interface HeaderProps {
  profile: Profile | null
  userEmail: string | undefined
  onShareClick: () => void
  onUpdatePassword: (password: string) => Promise<void>
  onUpdateEmail: (email: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export default function Header({
  profile,
  userEmail,
  onShareClick,
  onUpdatePassword,
  onUpdateEmail,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Title + Streak */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Share2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Cadent</h1>
            <DayStreakAchievement />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShareClick} className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share with Teacher</span>
            </Button>

            <UserMenu
              profile={profile}
              userEmail={userEmail}
              onUpdatePassword={onUpdatePassword}
              onUpdateEmail={onUpdateEmail}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      </div>
    </header>
  )
}