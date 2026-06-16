import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/student/share-status
// Returns the student's current share status (active, claimed, or none)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token_param = authHeader?.replace('Bearer ', '')
    if (!token_param) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token_param}` } }
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const student_id = user.id

    // Look for any active share (not yet claimed, not expired)
    const { data: activeShare } = await supabase
      .from('teacher_shares')
      .select('id, short_code, token, expires_at, created_at')
      .eq('student_id', student_id)
      .eq('is_active', true)
      .is('claimed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (activeShare) {
      return NextResponse.json({
        status: 'active',
        share: {
          id: activeShare.id,
          shortCode: activeShare.short_code,
          token: activeShare.token,
          expiresAt: activeShare.expires_at,
          createdAt: activeShare.created_at,
        }
      })
    }

    // Look for the most recently claimed share (claimed_by a teacher)
    const { data: claimedShare } = await supabase
      .from('teacher_shares')
      .select('id, claimed_at, claimed_by')
      .eq('student_id', student_id)
      .is('claimed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Check if there's a claimed share by looking for one that was claimed
    const { data: recentClaimed } = await supabase
      .from('teacher_shares')
      .select('id, claimed_at, claimed_by')
      .eq('student_id', student_id)
      .not('claimed_at', 'is', null)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .single()

    if (recentClaimed?.claimed_by) {
      // Get the teacher's profile name
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', recentClaimed.claimed_by)
        .single()

      // Also check if they're still on the roster (not removed)
      const { data: rosterEntry } = await supabase
        .from('teacher_students')
        .select('id')
        .eq('teacher_id', recentClaimed.claimed_by)
        .eq('student_id', student_id)
        .single()

      if (rosterEntry) {
        return NextResponse.json({
          status: 'claimed',
          teacher: {
            name: teacherProfile?.full_name || teacherProfile?.email?.split('@')[0] || 'Teacher',
            email: teacherProfile?.email || null,
          }
        })
      }
    }

    // Check for expired but unclaimed shares (student should revoke and recreate)
    const { data: expiredShare } = await supabase
      .from('teacher_shares')
      .select('id')
      .eq('student_id', student_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (expiredShare) {
      // Auto-cleanup: mark as inactive
      await supabase
        .from('teacher_shares')
        .update({ is_active: false })
        .eq('id', expiredShare.id)

      return NextResponse.json({ status: 'expired' })
    }

    return NextResponse.json({ status: 'none' })
  } catch (error) {
    console.error('[API /student/share-status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}