import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0);
}

export function getStripeClient(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY to enable Stripe billing.");
  }

  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  return _stripe;
}
