import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/consent/verify?token=xxx — Verify a consent token (for parent consent page)
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Missing token parameter' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Look up the consent token
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, consent_token, consent_requested_at, consent_verified_at')
      .eq('consent_token', token)
      .single()

    if (error || !profile) {
      return NextResponse.json({ valid: false, error: 'This consent link is invalid or has expired.' }, { status: 404 })
    }

    // Check if already verified
    if (profile.consent_verified_at) {
      return NextResponse.json({ valid: false, error: 'This consent link has already been used.' }, { status: 410 })
    }

    // Check if token is expired (24 hours)
    if (profile.consent_requested_at) {
      const requestedAt = new Date(profile.consent_requested_at)
      const now = new Date()
      const hoursSinceRequest = (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceRequest > 24) {
        return NextResponse.json({ valid: false, error: 'This consent link has expired. Please request a new one.' }, { status: 410 })
      }
    }

    return NextResponse.json({
      valid: true,
      student_name: profile.display_name || profile.full_name || 'this student'
    })
  } catch (error) {
    console.error('[API /consent/verify] Error:', error)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}