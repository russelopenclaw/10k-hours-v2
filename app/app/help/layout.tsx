import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help — Cadent',
  description: 'Learn how to use Cadent to track your music practice.',
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}