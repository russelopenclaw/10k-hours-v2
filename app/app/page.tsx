import type { Metadata } from 'next'
import AppContent from './AppContent'

export const metadata: Metadata = {
  title: 'My Songs',
  description: 'Your music practice dashboard.',
  robots: { index: false, follow: false },
}

export default function AppPage() {
  return <AppContent />
}