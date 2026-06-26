import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/leaderboard?period=7d|30d&view=student|teacher
// - Teacher view: shows all students (including opted-out)
// - Student view: shows only students with leaderboard_visibility=true
// Students use view=student (default), teachers use view=teacher
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

    const supabase = getSupabase()

    // Get the user's profile and determine their teacher scope
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const view = searchParams.get('view') || 'student'

    // Determine the teacher ID whose students to show
    let teacherId: string
    let isTeacherView: boolean

    if (profile.user_type === 'teacher') {
      teacherId = user.id
      // Teachers always see all students regardless of view param
      isTeacherView = true
    } else {
      // Students: find their teacher(s) — use the first one for leaderboard
      const { data: teacherLink } = await supabase
        .from('teacher_students')
        .select('teacher_id')
        .eq('student_id', user.id)
        .limit(1)
        .single()

      if (!teacherLink) {
        return NextResponse.json({ leaderboard: [], visibility: true })
      }

      teacherId = teacherLink.teacher_id
      // Student view always filters opted-out students
      isTeacherView = false
    }

    // Select the appropriate RPC
    if (isTeacherView) {
      // Teacher sees all students — existing unfiltered RPCs
      const rpcName = period === '30d' ? 'get_leaderboard_30d' : 'get_leaderboard_7d'
      const { data, error } = await supabase.rpc(rpcName, { p_teacher_id: teacherId })

      if (error) {
        console.error('[API /leaderboard] Teacher RPC error:', error)
        return NextResponse.json({ error: 'Failed to load leader board' }, { status: 500 })
      }

      return NextResponse.json({ leaderboard: data })
    } else {
      // Student sees only opted-in students — new filtered RPCs
      const rpcName = period === '30d' ? 'get_student_leaderboard_30d' : 'get_student_leaderboard_7d'
      const { data, error } = await supabase.rpc(rpcName, { p_teacher_id: teacherId })

      if (error) {
        console.error('[API /leaderboard] Student RPC error:', error)
        return NextResponse.json({ error: 'Failed to load leader board' }, { status: 500 })
      }

      // Also return the student's own visibility setting
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('leaderboard_visibility')
        .eq('id', user.id)
        .single()

      return NextResponse.json({
        leaderboard: data,
        visibility: studentProfile?.leaderboard_visibility ?? true
      })
    }
  } catch (error) {
    console.error('[API /leaderboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}