import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/stripe/portal
// Creates a Stripe Customer Portal session for managing subscription
export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated
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

    const supabase = getSupabaseAdmin()

    // Look up stripe_customer_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Subscribe first.' },
        { status: 400 }
      )
    }

    // Create portal session
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/app/teacher`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[API /stripe/portal] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
