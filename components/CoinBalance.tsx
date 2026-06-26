'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Star } from 'lucide-react'

interface CoinBalanceProps {
  /** Override the fetched balance (useful after earning points) */
  initialBalance?: number
}

export default function CoinBalance({ initialBalance }: CoinBalanceProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [balance, setBalance] = useState(initialBalance ?? 0)

  useEffect(() => {
    if (!user) return

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('total_coins')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setBalance(data?.total_coins ?? 0)
      } catch (err) {
        console.error('Error fetching point balance:', err)
      }
    }

    fetchBalance()

    // Listen for custom event from practice timer when points are earned
    const handleCoinsEarned = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail?.coinsEarned === 'number') {
        setBalance(prev => prev + detail.coinsEarned)
      } else {
        // Refetch if no amount provided
        fetchBalance()
      }
    }

    window.addEventListener('coinsEarned', handleCoinsEarned)
    return () => window.removeEventListener('coinsEarned', handleCoinsEarned)
  }, [user])

  if (balance === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#9CA3AF]">
      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F59E0B]" />
      <span className="font-semibold text-xs sm:text-sm tabular-nums">
        {balance.toLocaleString()}
      </span>
      <span className="font-medium text-xs hidden sm:inline">
        {balance === 1 ? 'point' : 'points'}
      </span>
    </div>
  )
}