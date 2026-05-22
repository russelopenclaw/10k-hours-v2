import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  try {
    const { data, error } = await supabase.rpc('get_student_practice_data', { share_token: token })

    if (error || !data) {
      return NextResponse.json({ error: 'Share link not found or has been revoked' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load share data' }, { status: 500 })
  }
}