import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, mapStripeStatus } from '@/lib/stripe'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/stripe/webhook
// Handles Stripe webhook events (signature-verified, no Bearer auth)
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const body = await request.text()
    const sigHeader = request.headers.get('stripe-signature')

    if (!sigHeader) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    let event: ReturnType<typeof stripe.webhooks.constructEvent>

    try {
      event = stripe.webhooks.constructEvent(body, sigHeader, webhookSecret)
    } catch (err) {
      console.error('[API /stripe/webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const supabaseUserId = session.metadata?.supabase_user_id

        if (!supabaseUserId) {
          console.error('[API /stripe/webhook] No supabase_user_id in session metadata')
          break
        }

        const subscriptionId = session.subscription as string | null

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'premium',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', supabaseUserId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        // Find the user by stripe_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const newStatus = mapStripeStatus(subscription.status)
          await supabase
            .from('profiles')
            .update({
              subscription_status: newStatus,
              stripe_subscription_id: subscription.id,
            })
            .eq('id', profile.id)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', profile.id)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          // Set to past_due but don't revoke — give grace period
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id)
        }

        break
      }

      default:
        // Unhandled event type — log but don't error
        console.log(`[API /stripe/webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[API /stripe/webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
