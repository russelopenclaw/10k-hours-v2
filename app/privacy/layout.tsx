import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Cadent privacy policy — how we collect, use, and protect your data. Includes COPPA protections for students under 13.',
  alternates: { canonical: 'https://www.cadent.online/privacy' },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}