import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/reports — List reports (admin sees all, teachers see reports on their students)
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

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.user_type !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view reports' }, { status: 403 })
    }

    // Get reports where the reported user is on the teacher's roster
    // Step 1: Get student IDs
    const { data: students } = await supabase
      .from('teacher_students')
      .select('student_id')
      .eq('teacher_id', user.id)

    if (!students || students.length === 0) {
      return NextResponse.json({ reports: [] })
    }

    const studentIds = students.map(s => s.student_id)

    // Step 2: Get reports for those students
    const { data: reports, error } = await supabase
      .from('content_reports')
      .select(`
        id,
        content_type,
        content_id,
        reason,
        description,
        status,
        created_at,
        reporter:profiles!content_reports_reporter_id_fkey(id, display_name, full_name),
        reported_user:profiles!content_reports_reported_user_id_fkey(id, display_name, full_name)
      `)
      .in('reported_user_id', studentIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API /reports GET] Error:', error)
      return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('[API /reports GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/reports — Update report status (dismiss or escalate)
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
    const { id, status } = body

    if (!id || !['dismissed', 'escalated'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request. Provide id and status (dismissed/escalated).' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('content_reports')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API /reports PATCH] Error:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ report: data })
  } catch (error) {
    console.error('[API /reports PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}