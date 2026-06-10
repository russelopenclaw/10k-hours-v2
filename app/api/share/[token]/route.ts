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
    const { data, error } = await supabase.rpc('get_student_practice_data', { share_token: token })

    if (error || !data) {
      return NextResponse.json({ error: 'Share link not found or has been revoked' }, { status: 404 })
    }

    // Add student_id from the teacher_shares lookup for auto-add feature
    const { data: shareRow } = await supabase
      .from('teacher_shares')
      .select('student_id')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    const result = {
      ...data,
      student_id: shareRow?.student_id || null,
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to load share data' }, { status: 500 })
  }
}