'use client'

import type { StudentWithStats } from './TeacherRoster'

interface StudentComparisonProps {
  students: StudentWithStats[]
}

export default function StudentComparison({ students }: StudentComparisonProps) {
  if (students.length < 2) return null

  const maxStreak = Math.max(...students.map(s => s.streakDays), 1)
  const maxMinutes = Math.max(...students.map(s => s.totalMinutesThisWeek), 1)
  const maxSessions = Math.max(...students.map(s => s.sessionsThisWeek), 1)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#F5F7FA]">Student Comparison</h2>

      {/* Streak Comparison */}
      <div className="bg-[#181B22] border border-white/[0.06] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-[#9CA3AF]">🔥 Practice Streak</span>
        </div>
        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.profile.id} className="flex items-center gap-3">
              <span className="text-xs text-[#9CA3AF] w-24 truncate">
                {student.profile.full_name?.split(' ')[0] || student.profile.email.split('@')[0]}
              </span>
              <div className="flex-1 bg-[#0d0d0f] rounded-full h-5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max((student.streakDays / maxStreak) * 100, student.streakDays > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-[#22D3EE] w-10 text-right font-medium">
                {student.streakDays}d
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Practice Time Comparison */}
      <div className="bg-[#181B22] border border-white/[0.06] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-[#9CA3AF]">⏱️ This Week</span>
        </div>
        <div className="space-y-2">
          {students.map((student) => {
            const hours = Math.floor(student.totalMinutesThisWeek / 60)
            const mins = student.totalMinutesThisWeek % 60
            return (
              <div key={student.profile.id} className="flex items-center gap-3">
                <span className="text-xs text-[#9CA3AF] w-24 truncate">
                  {student.profile.full_name?.split(' ')[0] || student.profile.email.split('@')[0]}
                </span>
                <div className="flex-1 bg-[#0d0d0f] rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#5e6ad2] to-[#818cf8] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max((student.totalMinutesThisWeek / maxMinutes) * 100, student.totalMinutesThisWeek > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-xs text-[#818cf8] w-14 text-right font-medium">
                  {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sessions This Week Comparison */}
      <div className="bg-[#181B22] border border-white/[0.06] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-[#9CA3AF]">📊 Sessions This Week</span>
        </div>
        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.profile.id} className="flex items-center gap-3">
              <span className="text-xs text-[#9CA3AF] w-24 truncate">
                {student.profile.full_name?.split(' ')[0] || student.profile.email.split('@')[0]}
              </span>
              <div className="flex-1 bg-[#0d0d0f] rounded-full h-5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max((student.sessionsThisWeek / maxSessions) * 100, student.sessionsThisWeek > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-[#fbbf24] w-10 text-right font-medium">
                {student.sessionsThisWeek}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}