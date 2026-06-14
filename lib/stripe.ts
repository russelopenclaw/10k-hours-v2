import Stripe from 'stripe'

// Server-side Stripe instance (uses secret key)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// Price IDs from environment
export const STRIPE_MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID!
export const STRIPE_ANNUAL_PRICE_ID = process.env.STRIPE_ANNUAL_PRICE_ID!
export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID!

// Subscription status helpers
export type SubscriptionStatus = 'free' | 'premium'

export function isPremium(status: string | null | undefined): boolean {
  return status === 'premium' || status === 'active' || status === 'trialing'
}

// Map Stripe subscription status to our internal status
export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'premium'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      // Give grace period — still premium for now
      return 'premium'
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'free'
    default:
      return 'free'
  }
}