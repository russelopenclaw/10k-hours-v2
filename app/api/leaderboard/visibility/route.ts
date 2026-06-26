import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH /api/leaderboard/visibility
// Students toggle their leaderboard visibility
// Body: { leaderboard_visibility: boolean }
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leaderboard_visibility } = body

    if (typeof leaderboard_visibility !== 'boolean') {
      return NextResponse.json({ error: 'leaderboard_visibility must be true or false' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Verify the user is a student (only students can opt out)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Teachers can't opt out (they don't appear on the student leaderboard anyway)
    if (profile.user_type === 'teacher') {
      return NextResponse.json({ error: 'Teachers cannot change leaderboard visibility' }, { status: 403 })
    }

    // Update the student's visibility
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ leaderboard_visibility })
      .eq('id', user.id)

    if (updateError) {
      console.error('[API /leaderboard/visibility] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 })
    }

    return NextResponse.json({ success: true, leaderboard_visibility })
  } catch (error) {
    console.error('[API /leaderboard/visibility] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}