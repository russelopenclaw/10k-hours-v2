import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/assignments/[id]/attachment — Get signed URL for assignment attachment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify the assignment exists and the user is either the teacher or student
    const { data: assignment } = await supabase
      .from('assignments')
      .select('teacher_id, student_id')
      .eq('id', id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (user.id !== assignment.teacher_id && user.id !== assignment.student_id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // List files in the bucket for this assignment
    const { data: files, error: listError } = await supabase.storage
      .from('assignment-attachments')
      .list(`${assignment.teacher_id}/${id}`, { limit: 10 })

    if (listError || !files || files.length === 0) {
      return NextResponse.json({ attachment: null })
    }

    // Get the first file (there should only be one per assignment)
    const file = files[0]
    const filePath = `${assignment.teacher_id}/${id}/${file.name}`

    // Generate a signed URL valid for 1 hour
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('assignment-attachments')
      .createSignedUrl(filePath, 3600)

    if (urlError || !signedUrlData) {
      console.error('[API /assignments/[id]/attachment] Signed URL error:', urlError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      attachment: {
        name: file.name,
        size: file.metadata?.size,
        type: file.metadata?.mimetype,
        url: signedUrlData.signedUrl,
      }
    })
  } catch (error) {
    console.error('[API /assignments/[id]/attachment] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}