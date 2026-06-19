import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/teacher/assignments — list assignments for a teacher or student
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
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'teacher'

    if (role === 'teacher') {
      // Teacher sees assignments they created
      const { data, error } = await supabase
        .from('assignments')
        .select('*, student:profiles!assignments_student_id_fkey(id, full_name, email, instrument)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ assignments: data })
    } else {
      // Student sees assignments assigned to them
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ assignments: data })
    }
  } catch (error) {
    console.error('[API /teacher/assignments GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/teacher/assignments — create a new assignment
export async function POST(request: NextRequest) {
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
    const { student_id, song_id, title, tempo, goal, notes, due_at } = body

    if (!student_id || !title) {
      return NextResponse.json({ error: 'Missing required fields: student_id, title' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Verify this student is on the teacher's roster
    const { data: rosterEntry } = await supabase
      .from('teacher_students')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('student_id', student_id)
      .single()

    if (!rosterEntry) {
      return NextResponse.json({ error: 'Student not on your roster' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        teacher_id: user.id,
        student_id,
        song_id: song_id || null,
        title,
        tempo: tempo || null,
        goal: goal || null,
        notes: notes || null,
        due_at: due_at || null,
        status: 'assigned',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assignment: data }, { status: 201 })
  } catch (error) {
    console.error('[API /teacher/assignments POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/teacher/assignments — update assignment status
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
    const { id, status, tempo, goal, notes, due_at, song_id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Check if user is teacher (owner) or student (assignee)
    const { data: assignment } = await supabase
      .from('assignments')
      .select('teacher_id, student_id')
      .eq('id', id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const isTeacher = assignment.teacher_id === user.id
    const isStudent = assignment.student_id === user.id

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (status !== undefined) updates.status = status
    if (song_id !== undefined) updates.song_id = song_id
    if (isTeacher) {
      // Teachers can update all fields
      if (tempo !== undefined) updates.tempo = tempo
      if (goal !== undefined) updates.goal = goal
      if (notes !== undefined) updates.notes = notes
      if (due_at !== undefined) updates.due_at = due_at
    }
    // Students can only update status

    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assignment: data })
  } catch (error) {
    console.error('[API /teacher/assignments PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/teacher/assignments — delete an assignment
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('teacher_id', user.id) // Only teacher can delete

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /teacher/assignments DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}