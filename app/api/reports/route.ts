import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content_type, content_id, reason, description } = body

    // Validate required fields
    if (!content_type || !content_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, content_id, reason' },
        { status: 400 }
      )
    }

    // Validate content_type enum
    const validContentTypes = ['assignment', 'attachment', 'display_name', 'profile', 'other']
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid content_type' },
        { status: 400 }
      )
    }

    // Validate reason enum
    const validReasons = ['inappropriate', 'offensive', 'spam', 'harassment', 'other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Insert the report
    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        content_type,
        content_id,
        reason,
        description: description?.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[API /reports] Error inserting report:', error)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })

  } catch (err) {
    console.error('[API /reports] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}