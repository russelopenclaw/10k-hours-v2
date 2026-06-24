'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, ClipboardList, BarChart3, Crown, Music, Share2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TeacherHelpPage() {
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Teacher Portal Help</h1>
        <p className="text-[#9CA3AF] mb-8">Everything you need to manage your students and track their progress.</p>

        {/* Roster */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Users className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Student Roster</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">Add students</strong> — Tap <em>Add Student</em> and enter their email. They&apos;ll receive an invitation to connect.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">View student details</strong> — Tap any student row to see their practice history, streak, and session details.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Remove a student</strong> — Tap <em>Remove</em> to disconnect a student from your roster. This doesn&apos;t delete their account — it just removes the connection.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Student comparison</strong> — When you have 2+ students, a comparison chart shows sessions, time, and streaks side by side.
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
              <strong className="text-[#F5F7FA]">Assign a piece</strong> — In a student&apos;s detail view, tap <em>Assign Piece</em>. Enter the title, artist, tempo (BPM), and notes. The assignment appears in their Assignments tab.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Track completion</strong> — Students add assignments to their library and practice them. You can see their progress in the session history.
            </p>
          </div>
        </section>

        {/* Analytics */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">Practice Insights</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              <strong className="text-[#F5F7FA]">30-day practice chart</strong> — See how many minutes each student practiced over the last 30 days.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Most practiced songs</strong> — Quick view of which pieces each student is working on the most.
            </p>
            <p>
              <strong className="text-[#F5F7FA]">Streak tracking</strong> — Each student&apos;s streak badge shows how many consecutive days they&apos;ve practiced.
            </p>
          </div>
        </section>

        {/* Sharing */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/[0.1] flex items-center justify-center">
              <Share2 className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <h2 className="text-xl font-semibold">How Students Connect</h2>
          </div>
          <div className="space-y-3 text-[#B0B8C4] pl-2">
            <p>
              Students connect by tapping <em>Share</em> in their header and entering your email. You can also add them by email from your roster.
            </p>
            <p>
              Once connected, you can see their practice data in real time. They can see assignments you&apos;ve given them.
            </p>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/[0.1] flex items-center justify-center">
              <Crown className="h-5 w-5 text-[#fbbf24]" />
            </div>
            <h2 className="text-xl font-semibold">Free vs. Teacher Pro</h2>
          </div>
          <p className="text-[#9CA3AF] mb-4 pl-2">
            Cadent is free for teachers with up to 3 students. Upgrade to Teacher Pro for unlimited students and advanced features.
          </p>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#181B22]">
                  <th className="text-left p-3 text-[#9CA3AF] font-medium">Feature</th>
                  <th className="text-center p-3 text-[#9CA3AF] font-medium">Free</th>
                  <th className="text-center p-3 text-[#fbbf24] font-medium">
                    <Crown className="h-3.5 w-3.5 inline mr-1" />
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr className="bg-[#0F1115]">
                  <td className="p-3 text-[#B0B8C4]">Students</td>
                  <td className="p-3 text-center">Up to 3</td>
                  <td className="p-3 text-center text-[#22D3EE] font-medium">Unlimited</td>
                </tr>
                <tr className="bg-[#181B22]">
                  <td className="p-3 text-[#B0B8C4]">Practice tracking</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#0F1115]">
                  <td className="p-3 text-[#B0B8C4]">View student sessions</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#181B22]">
                  <td className="p-3 text-[#B0B8C4]">Assign pieces</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#0F1115]">
                  <td className="p-3 text-[#B0B8C4]">Student comparison chart</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#181B22]">
                  <td className="p-3 text-[#B0B8C4]">30-day practice chart</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#0F1115]">
                  <td className="p-3 text-[#B0B8C4]">Metronome &amp; tempo</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#181B22]">
                  <td className="p-3 text-[#B0B8C4]">Unlocked student details</td>
                  <td className="p-3 text-center"><X className="h-4 w-4 text-[#6B7280] mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-[#0F1115]">
                  <td className="p-3 text-[#B0B8C4]">Advanced analytics</td>
                  <td className="p-3 text-center"><X className="h-4 w-4 text-[#6B7280] mx-auto" /></td>
                  <td className="p-3 text-center text-[#22D3EE]">Coming soon</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#6B7280] text-xs mt-2 pl-2">
            Teacher Pro is $9.99/month or $99/year. 14-day free trial included.
          </p>
        </section>

        {/* Tips */}
        <section className="mt-10 p-6 bg-[#22D3EE]/[0.05] border border-[#22D3EE]/20 rounded-2xl">
          <h2 className="text-lg font-semibold text-[#22D3EE] mb-3">💡 Teaching Tips</h2>
          <ul className="space-y-2 text-[#B0B8C4]">
            <li>• <strong className="text-[#F5F7FA]">Assign specific pieces</strong> — Students with clear assignments practice more consistently.</li>
            <li>• <strong className="text-[#F5F7FA]">Set tempo expectations</strong> — Include a BPM on assignments so students know the target speed.</li>
            <li>• <strong className="text-[#F5F7FA]">Check streaks weekly</strong> — A streak of 0 means they haven&apos;t opened the app. Reach out!</li>
            <li>• <strong className="text-[#F5F7FA]">Use the comparison chart</strong> — Spot who&apos;s practicing and who&apos;s falling behind at a glance.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}