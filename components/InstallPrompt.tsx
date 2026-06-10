'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if user previously dismissed
    if (localStorage.getItem('cadent-install-dismissed')) return

    // Detect iOS Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !((window as unknown as Record<string, unknown>).MSStream)
    setIsIOS(!!isIOSDevice)

    if (isIOSDevice) {
      // Show iOS banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('cadent-install-dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <>
      {/* Main install banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-slide-up">
        <div className="bg-[#181B22] border border-[#22D3EE]/20 rounded-xl p-4 shadow-lg shadow-[#22D3EE]/5">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-[#6B7280] hover:text-[#F5F7FA] transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#F5F7FA]">Install Cadent</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {isIOS
                  ? 'Add to your home screen for quick access and offline practice tracking.'
                  : 'Install for quick access, offline practice tracking, and no browser toolbar.'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {isIOS ? (
              <button
                onClick={() => setShowIOSInstructions(true)}
                className="w-full h-9 rounded-lg bg-[#22D3EE] text-[#0F1115] text-sm font-medium hover:bg-[#67E8F9] transition-colors"
              >
                How to Install
              </button>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full h-9 rounded-lg bg-[#22D3EE] text-[#0F1115] text-sm font-medium hover:bg-[#67E8F9] transition-colors"
              >
                Install App
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="h-9 px-3 rounded-lg border border-white/[0.06] text-[#9CA3AF] text-sm hover:text-[#F5F7FA] transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      {/* iOS instruction sheet */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowIOSInstructions(false)}>
          <div className="bg-[#181B22] border border-white/[0.06] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-[#F5F7FA] mb-4">Install on iOS</h3>
            <ol className="space-y-3 text-sm text-[#9CA3AF]">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center text-xs font-medium shrink-0">1</span>
                <span>Tap the <strong className="text-[#F5F7FA]">Share button</strong> <svg className="inline h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg> at the bottom of Safari</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center text-xs font-medium shrink-0">2</span>
                <span>Scroll down and tap <strong className="text-[#F5F7FA]">Add to Home Screen</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center text-xs font-medium shrink-0">3</span>
                <span>Tap <strong className="text-[#F5F7FA]">Add</strong> in the top right</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="mt-5 w-full h-10 rounded-lg bg-[#22D3EE] text-[#0F1115] text-sm font-medium hover:bg-[#67E8F9] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}