import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/notifications/preferences — fetch the user's reminder settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('reminder_enabled, reminder_time, push_subscription')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({
      reminder_enabled: profile.reminder_enabled ?? false,
      reminder_time: profile.reminder_time ?? '19:00',
      has_push_subscription: !!profile.push_subscription,
    })
  } catch (err) {
    console.error('[Notifications] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications/preferences — update reminder settings
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { reminder_enabled, reminder_time, push_subscription } = body

    const update: Record<string, unknown> = {}
    if (typeof reminder_enabled === 'boolean') update.reminder_enabled = reminder_enabled
    if (typeof reminder_time === 'string') {
      // Validate time format (HH:MM)
      if (!/^\d{2}:\d{2}$/.test(reminder_time)) {
        return NextResponse.json({ error: 'Invalid time format, expected HH:MM' }, { status: 400 })
      }
      update.reminder_time = reminder_time
    }
    if (push_subscription !== undefined) update.push_subscription = push_subscription

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Notifications] PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}