'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Music, Play, Flame, Share2, ClipboardList, Clock, Settings, Trophy, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HelpPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F5F7FA]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-[#9CA3AF] hover:text-[#F5F7FA] -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">How to Use Cadent</h1>
        <p className="text-[#9CA3AF] mb-8">Everything you need to know about tracking your practice.</p>

        {/* Song Library */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Music className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Song Library</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">Add a song</strong>: Tap the &quot;Add Song&quot; button on the Library tab. Enter the title, artist (optional), and a color dot to identify it.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Edit a song</strong>: Tap the gear icon on any song card to change its details, set a tempo/BPM, or add notes.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Remove a song</strong>: Open the song&apos;s settings and tap &quot;Delete Song&quot;.
            </p>
          </div>
        </section>

        {/* Practice Timer */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Play className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Practice Timer</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">Start practicing</strong>: Tap any song card to select it, then tap &quot;Start Practice&quot; on the timer. Or tap the &quot;Start Practice&quot; button directly on the song card, which starts the timer automatically.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Pause &amp; resume</strong>: Tap &quot;Pause&quot; to take a break. Tap &quot;Resume&quot; when you&apos;re ready to continue.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Stop &amp; save</strong>: Tap &quot;Stop &amp; Save&quot; to end your session. Your time is recorded automatically.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Keyboard shortcut</strong>: Press the space bar to start or pause the timer when you&apos;re on the practice screen.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Auto-save on song switch</strong>: Switching songs mid-practice? Your session auto-saves so you don&apos;t lose your time.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Idle detection</strong>: If you step away during practice, the timer checks in after 5 minutes. Tap &quot;Still practicing&quot; to keep your session going, or it will pause automatically.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Notes &amp; metronome</strong>: While the timer is running, you can open notes or the built-in metronome to keep time.
            </p>
          </div>
        </section>

        {/* Streak */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Flame className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Practice Streak</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              The <strong className="text-[#F5F7FA]">streak badge</strong> 🔥 in the header shows how many consecutive days you&apos;ve practiced. Practice at least once a day to keep your streak alive!
            </p>
            <p>
              Your streak resets if you miss a day. Consistency is key: even 5 minutes counts.
            </p>
          </div>
        </section>

        {/* Points & Leader Board */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/[0.1] flex items-center justify-center">
              <Trophy className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <h2 className="text-xl font-semibold">Points &amp; Leader Board</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">Earn points</strong>: You earn 1 point for every minute of practice. The more you practice, the more points you collect.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Streak multipliers</strong>: Keep your streak going to multiply your points. A 3-day streak gives 1.5x, a 7-day streak gives 2x, a 14-day streak gives 3x, and a 30-day streak gives 5x.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Leader board</strong>: Tap the trophy icon ⭐ in the header to see the leader board. It shows the top practicers in your studio over the last 7 or 30 days.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Opt out</strong>: You can choose to hide your points from other students. Tap the visibility toggle at the top of the leader board page to opt out. Your teacher can always see your practice data regardless of this setting.
            </p>
          </div>
        </section>

        {/* Sharing */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Share2 className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Sharing with a Teacher</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">Connect with a teacher</strong>: Tap &quot;Share&quot; in the header to create a share code. Give the code or link to your teacher so they can view your practice data.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">What your teacher sees</strong>: Once connected, your teacher can see your practice history: which songs, how long, and your streak.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Assignments</strong>: If your teacher has Teacher Pro, they can assign pieces for you to practice. Assignments appear in the &quot;Assignments&quot; tab. Tap an assignment to add it to your library.
            </p>
          </div>
        </section>

        {/* Assignments */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Assignments</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">View assignments</strong>: Tap the &quot;Assignments&quot; tab to see pieces your teacher has assigned.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Add to library</strong>: Tap &quot;Add to Library&quot; on an assignment to create a song card for it. Then practice it like any other song.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Attachments</strong>: Your teacher may include files like sheet music or recordings with an assignment. Tap the attachment link to view or download it.
            </p>
            <p>
              The badge count on the Assignments tab shows new assignments you haven&apos;t viewed yet.
            </p>
          </div>
        </section>

        {/* Reporting Content */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Reporting Content</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">See something inappropriate?</strong>: Tap the report icon on any assignment or display name to flag it for your teacher. Reports are reviewed by your teacher.
            </p>
          </div>
        </section>

        {/* Time tracking */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Time Tracking</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              Each song card shows <strong className="text-[#F5F7FA]">total practice time</strong> so you can see your progress at a glance.
            </p>
            <p>
              If your teacher has assigned a tempo (BPM), it&apos;ll appear on the song card. Use the built-in metronome while practicing to stay on tempo.
            </p>
          </div>
        </section>

        {/* Settings */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Profile &amp; Settings</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              Tap your avatar in the top-right corner to change your display name, update your email, or reset your password.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Show/hide password</strong>: When signing in or resetting your password, tap the eye icon to show or hide your password.
            </p>
            <p>
              You can also disconnect from your teacher from the sharing dialog.
            </p>
          </div>
        </section>

        {/* Age Gate & Consent */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Safety &amp; Privacy</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">Under 13?</strong>: If you are under 13, you will need a parent or guardian to provide consent before using Cadent. During sign-up, you will be asked for your age, and a consent form will be sent to your parent&apos;s email.
            </p>
            <p>
              Your privacy matters. Your practice data is only shared with teachers you connect to, and you can opt out of the leader board at any time.
            </p>
          </div>
        </section>

        {/* Tips */}
        <section className="mt-10 p-6 bg-[#22D3EE]/[0.05] border border-[#22D3EE]/20 rounded-2xl">
          <h2 className="text-lg font-semibold text-[#22D3EE] mb-3">💡 Practice Tips</h2>
          <ul className="space-y-2 text-[#B0B8C4]">
            <li>• <strong className="text-[#F5F7FA]">Consistency &gt; duration</strong>: A 10-minute daily streak beats a 2-hour marathon once a week.</li>
            <li>• <strong className="text-[#F5F7FA]">Use the metronome</strong>: Start slow and increase tempo as you improve.</li>
            <li>• <strong className="text-[#F5F7FA]">Add notes to songs</strong>: Jot down tricky measures, fingerings, or reminders for next time.</li>
            <li>• <strong className="text-[#F5F7FA]">Check assignments regularly</strong>: Your teacher can see which assignments you&apos;ve viewed.</li>
            <li>• <strong className="text-[#F5F7FA]">Aim for streak multipliers</strong>: A 7-day streak doubles your points. A 30-day streak gives 5x!</li>
          </ul>
        </section>
      </div>
    </div>
  )
}