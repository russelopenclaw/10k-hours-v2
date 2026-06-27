import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Cadent terms of service — account requirements, acceptable use, subscriptions, and policies for the music practice tracker.',
  alternates: { canonical: 'https://www.cadent.online/terms' },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}