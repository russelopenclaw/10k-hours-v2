import type { Metadata } from 'next'
import HomeContent from './HomeContent'

export const metadata: Metadata = {
  title: 'Cadent — Music Practice Tracker for Students & Teachers',
  description: 'Track your music practice time, build daily streaks, and share progress with your teacher through a simple link. Free forever for students.',
  alternates: {
    canonical: 'https://www.cadent.online',
  },
  openGraph: {
    title: 'Cadent — Music Practice Tracker',
    description: 'Track your music practice time, build daily streaks, and share progress with your teacher. Free forever.',
    url: 'https://www.cadent.online',
  },
}

export default function HomePage() {
  return <HomeContent />
}