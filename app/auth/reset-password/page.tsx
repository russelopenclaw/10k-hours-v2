import type { Metadata } from 'next'
import ResetPasswordContent from './ResetPasswordContent'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />
}