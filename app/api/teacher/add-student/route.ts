import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I,O,0,1 to avoid confusion
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `CAD-${code}`
}

// POST /api/teacher/add-student
// Teacher adds a student to their roster by share token or short code
export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated
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

    const body = await request.json()
    const { token, shortCode } = body
    const teacher_id = user.id

    if (!token && !shortCode) {
      return NextResponse.json({ error: 'Missing token or short code' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Look up the share by token or short code
    let shareQuery = supabase
      .from('teacher_shares')
      .select('id, student_id, is_active, expires_at, claimed_at, short_code')
      .eq('is_active', true)

    if (shortCode) {
      shareQuery = shareQuery.eq('short_code', shortCode)
    } else {
      shareQuery = shareQuery.eq('token', token)
    }

    const { data: share, error: shareError } = await shareQuery.single()

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share code not found or has been revoked' }, { status: 404 })
    }

    // Check if share has expired
    if (new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share code has expired. Ask your student for a new one.' }, { status: 410 })
    }

    // Check if share has already been claimed
    if (share.claimed_at) {
      return NextResponse.json({ error: 'This share code has already been used.' }, { status: 410 })
    }

    // Check if already on roster
    const { data: existing } = await supabase
      .from('teacher_students')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('student_id', share.student_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Student already on roster', student_id: share.student_id }, { status: 409 })
    }

    // Check free tier limit
    const { count } = await supabase
      .from('teacher_students')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacher_id)

    // Check if teacher is pro
    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', teacher_id)
      .single()

    const isPro = teacherProfile?.subscription_status === 'premium'
    const FREE_LIMIT = 3

    if (!isPro && (count ?? 0) >= FREE_LIMIT) {
      return NextResponse.json({
        error: `Free teachers can have up to ${FREE_LIMIT} students. Upgrade to Teacher Pro for unlimited students.`,
        limit_reached: true
      }, { status: 403 })
    }

    // Add to roster
    const { error: insertError } = await supabase
      .from('teacher_students')
      .insert({
        teacher_id,
        student_id: share.student_id,
      })

    if (insertError) {
      console.error('Error adding student to roster:', insertError)
      return NextResponse.json({ error: 'Failed to add student' }, { status: 500 })
    }

    // Mark the share as claimed
    await supabase
      .from('teacher_shares')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by: teacher_id,
        is_active: false
      })
      .eq('id', share.id)

    // Return the student profile so the UI can update immediately
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email, instrument')
      .eq('id', share.student_id)
      .single()

    return NextResponse.json({
      message: 'Student added to roster',
      student: studentProfile
    })
  } catch (error) {
    console.error('[API /teacher/add-student] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}