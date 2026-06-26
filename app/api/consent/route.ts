import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/consent/generate — Generate a consent token for a student's parent
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

    const supabase = getSupabase()

    // Check this user actually needs consent
    const { data: profile } = await supabase
      .from('profiles')
      .select('consent_status')
      .eq('id', user.id)
      .single()

    if (!profile || profile.consent_status === 'not_required' || profile.consent_status === 'approved') {
      return NextResponse.json({ error: 'Consent not required or already approved' }, { status: 400 })
    }

    // Generate consent token
    const { data, error } = await supabase.rpc('generate_consent_token', { p_user_id: user.id })

    if (error) {
      console.error('[API /consent/generate] RPC error:', error)
      return NextResponse.json({ error: 'Failed to generate consent link' }, { status: 500 })
    }

    const consentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cadent.online'}/consent/${data}`
    return NextResponse.json({ consent_url: consentUrl, token: data })
  } catch (error) {
    console.error('[API /consent/generate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


// GET /api/consent/verify?token=UUID — Check if a consent token is valid (for the consent page)
// POST /api/consent/verify — Approve or deny consent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consentToken = searchParams.get('token')
    if (!consentToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, consent_status, consent_requested_at')
      .eq('consent_token', consentToken)
      .single()

    if (!profile) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired consent link' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      student_name: profile.display_name || profile.full_name || 'a student',
      requested_at: profile.consent_requested_at
    })
  } catch (error) {
    console.error('[API /consent/verify GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/consent/verify — Parent approves or denies
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, approved } = body

    if (!token || approved === undefined) {
      return NextResponse.json({ error: 'Missing token or approved flag' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('verify_parent_consent', {
      p_token: token,
      p_approved: approved
    })

    if (error) {
      console.error('[API /consent/verify PATCH] RPC error:', error)
      return NextResponse.json({ error: 'Failed to verify consent' }, { status: 500 })
    }

    const result = data?.[0]
    if (!result?.success) {
      return NextResponse.json({ error: 'Invalid or expired consent link' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      student_name: result.display_name,
      approved
    })
  } catch (error) {
    console.error('[API /consent/verify PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}