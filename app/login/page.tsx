import type { Metadata } from 'next'
import LoginContent from './LoginContent'

// Force dynamic rendering so middleware auth redirect runs on every request
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Cadent account to track your music practice and share progress with your teacher.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: 'https://www.cadent.online/login',
  },
  openGraph: {
    title: 'Sign In — Cadent',
    description: 'Sign in to track your music practice and share progress with your teacher.',
    url: 'https://www.cadent.online/login',
  },
}

export default function LoginPage() {
  return <LoginContent />
}