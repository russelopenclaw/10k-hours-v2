import type { Metadata } from 'next'
import TeacherRosterContent from './TeacherRosterContent'

export const metadata: Metadata = {
  title: 'My Students',
  description: 'View and manage your students\' practice progress on Cadent.',
  robots: { index: false, follow: false },
}

export default function TeacherPage() {
  return <TeacherRosterContent />
}