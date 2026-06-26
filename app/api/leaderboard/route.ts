import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/leaderboard?period=7d|30d
// Returns leaderboard for the authenticated teacher's students
export async function GET(request: NextRequest) {
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

    // Verify user is a teacher
    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.user_type !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view leaderboards' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const rpcName = period === '30d' ? 'get_leaderboard_30d' : 'get_leaderboard_7d'

    const { data, error } = await supabase.rpc(rpcName, { p_teacher_id: user.id })

    if (error) {
      console.error('[API /leaderboard] RPC error:', error)
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
    }

    return NextResponse.json({ leaderboard: data })
  } catch (error) {
    console.error('[API /leaderboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}