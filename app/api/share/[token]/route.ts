import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = getSupabase()

  try {
    // Try to find the share by token (UUID) or short_code (CAD-XXXX)
    let shareQuery = supabase
      .from('teacher_shares')
      .select('student_id, is_active, expires_at, claimed_at, short_code')
      .eq('is_active', true)

    // If it looks like a short code (starts with CAD-), search by short_code
    if (token.startsWith('CAD-')) {
      shareQuery = shareQuery.eq('short_code', token)
    } else {
      shareQuery = shareQuery.eq('token', token)
    }

    const { data: shareRow, error: shareError } = await shareQuery.single()

    if (shareError || !shareRow) {
      return NextResponse.json({ error: 'Share link not found or has been revoked' }, { status: 404 })
    }

    // Check expiry
    if (new Date(shareRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share code has expired' }, { status: 410 })
    }

    // Check if already claimed
    if (shareRow.claimed_at) {
      return NextResponse.json({ error: 'This share code has already been used' }, { status: 410 })
    }

    // Get student practice data using the existing function
    // For short codes, we need to look up by token (UUID) for the RPC
    const shareToken = token.startsWith('CAD-') ? null : token

    if (!shareToken) {
      // Short code path: look up student data directly
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', shareRow.student_id)
        .single()

      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', shareRow.student_id)

      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', shareRow.student_id)

      return NextResponse.json({
        profile: profile,
        songs: songs || [],
        sessions: sessions || [],
        student_id: shareRow.student_id,
      })
    }

    // UUID token path: use the existing RPC function
    const { data, error } = await supabase.rpc('get_student_practice_data', { share_token: shareToken })

    if (error || !data) {
      return NextResponse.json({ error: 'Share link not found or has been revoked' }, { status: 404 })
    }

    return NextResponse.json({
      ...data,
      student_id: shareRow.student_id,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load share data' }, { status: 500 })
  }
}