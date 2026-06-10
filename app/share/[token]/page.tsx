import type { Metadata } from 'next'
import ShareContent from './ShareContent'

export const metadata: Metadata = {
  title: 'Student Practice Report',
  description: 'View your student\'s music practice history, streaks, and song progress on Cadent.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://www.cadent.online/share',
  },
  openGraph: {
    title: 'Student Practice Report — Cadent',
    description: 'View your student\'s music practice history, streaks, and song progress.',
    url: 'https://www.cadent.online/share',
  },
}

export default function SharePage() {
  return <ShareContent />
}