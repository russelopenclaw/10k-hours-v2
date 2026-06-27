'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Key, Mail, LogOut, BarChart3, Music, ChevronDown, PenLine, Bell } from 'lucide-react'
import { Database } from '@/lib/supabase'
import ChangePasswordDialog from '@/components/ChangePasswordDialog'
import ChangeEmailDialog from '@/components/ChangeEmailDialog'
import ChangeDisplayNameDialog from '@/components/ChangeDisplayNameDialog'
import ReminderSettingsDialog from '@/components/ReminderSettingsDialog'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserMenuProps {
  profile: Profile | null
  userEmail: string | undefined
  accessToken: string | null
  onUpdatePassword: (password: string) => Promise<void>
  onUpdateEmail: (email: string) => Promise<void>
  onUpdateDisplayName: (name: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export default function UserMenu({
  profile,
  userEmail,
  accessToken,
  onUpdatePassword,
  onUpdateEmail,
  onUpdateDisplayName,
  onSignOut,
}: UserMenuProps) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangeDisplayName, setShowChangeDisplayName] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const router = useRouter()

  const displayName = profile?.full_name || userEmail || 'User'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="sm:hidden" onClick={() => router.push('/')}>
              <Music className="h-4 w-4 mr-2" />
              Library
            </DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={() => router.push('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowChangeDisplayName(true)}>
              <PenLine className="h-4 w-4 mr-2" />
              Change Display Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowChangeEmail(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Change Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowReminders(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Practice Reminders
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onUpdatePassword={onUpdatePassword}
      />
      <ChangeEmailDialog
        isOpen={showChangeEmail}
        onClose={() => setShowChangeEmail(false)}
        currentEmail={userEmail || ''}
        onUpdateEmail={onUpdateEmail}
      />
      <ChangeDisplayNameDialog
        isOpen={showChangeDisplayName}
        onClose={() => setShowChangeDisplayName(false)}
        currentName={profile?.full_name || ''}
        onUpdateDisplayName={onUpdateDisplayName}
      />
      <ReminderSettingsDialog
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        profile={profile}
        accessToken={accessToken}
      />
    </>
  )
}