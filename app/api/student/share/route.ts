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

// POST /api/student/share — Create a new share code (one at a time)
export async function POST(request: NextRequest) {
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

    // Check for existing active share (one at a time)
    const { data: existingActive } = await supabase
      .from('teacher_shares')
      .select('id, short_code, token, expires_at')
      .eq('student_id', student_id)
      .eq('is_active', true)
      .is('claimed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingActive) {
      return NextResponse.json({
        message: 'You already have an active share code',
        share: {
          id: existingActive.id,
          shortCode: existingActive.short_code,
          token: existingActive.token,
          expiresAt: existingActive.expires_at,
        }
      })
    }

    // Clean up any expired active shares for this student
    await supabase
      .from('teacher_shares')
      .update({ is_active: false })
      .eq('student_id', student_id)
      .eq('is_active', true)

    // Generate a unique short code
    let shortCode = generateShortCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('teacher_shares')
        .select('id')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break
      shortCode = generateShortCode()
      attempts++
    }

    // Create the share
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data: share, error: insertError } = await supabase
      .from('teacher_shares')
      .insert({
        student_id,
        short_code: shortCode,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select('id, short_code, token, expires_at')
      .single()

    if (insertError || !share) {
      console.error('Error creating share:', insertError)
      return NextResponse.json({ error: 'Failed to create share code' }, { status: 500 })
    }

    return NextResponse.json({
      share: {
        id: share.id,
        shortCode: share.short_code,
        token: share.token,
        expiresAt: share.expires_at,
      }
    })
  } catch (error) {
    console.error('[API /student/share] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/student/share — Revoke the current active share
export async function DELETE(request: NextRequest) {
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

    // Revoke any active shares for this student
    const { error: updateError } = await supabase
      .from('teacher_shares')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('student_id', student_id)
      .eq('is_active', true)

    if (updateError) {
      console.error('Error revoking share:', updateError)
      return NextResponse.json({ error: 'Failed to revoke share' }, { status: 500 })
    }

    // Also remove any teacher_students entries for this student
    // (they'll need to re-share if they want a teacher to see their data again)
    await supabase
      .from('teacher_students')
      .delete()
      .eq('student_id', student_id)

    return NextResponse.json({ message: 'Share revoked' })
  } catch (error) {
    console.error('[API /student/share DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}