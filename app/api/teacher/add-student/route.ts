import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/teacher/add-student
// Teacher adds a student to their roster by share token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, teacher_id } = body

    if (!token || !teacher_id) {
      return NextResponse.json({ error: 'Missing token or teacher_id' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Look up the share to get student_id
    const { data: share, error: shareError } = await supabase
      .from('teacher_shares')
      .select('student_id, is_active')
      .eq('token', token)
      .single()

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    if (!share.is_active) {
      return NextResponse.json({ error: 'This share link has been revoked' }, { status: 410 })
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