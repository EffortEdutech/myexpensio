import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'
import { syncSubscriptionStatusSnapshot } from '@/lib/billing/sync'
import {
  ensureBillingCustomer,
  markCheckoutSessionStatus,
  maybeCreateCommissionForPaidInvoice,
  resolveOrgIdFromProviderObject,
  resolvePlanByProviderPrice,
  unixToIso,
  verifyStripeSignature,
} from '@/lib/billing/providers'

type StripeEvent = {
  id: string
  type: string
  data?: {
    object?: Record<string, unknown>
  }
}

function mapStripeSubscriptionStatus(status: string | null | undefined) {
  const value = (status ?? '').toLowerCase()
  switch (value) {
    case 'trialing':
      return 'TRIALING'
    case 'active':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'unpaid':
      return 'UNPAID'
    case 'canceled':
      return 'CANCELED'
    case 'incomplete_expired':
      return 'EXPIRED'
    default:
      return 'INCOMPLETE'
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return err('INVALID_SIGNATURE', 'Stripe signature verification failed.', 400)
  }

  const event = JSON.parse(rawBody) as StripeEvent
  const object = (event.data?.object ?? {}) as Record<string, unknown>
  const db = createServiceRoleClient()

  const orgId = await resolveOrgIdFromProviderObject(db, 'STRIPE', object)

  const { error: eventInsertError } = await db
    .from('billing_events')
    .insert({
      provider: 'STRIPE',
      provider_event_id: event.id,
      event_type: event.type,
      org_id: orgId,
      payload: event,
      processing_status: 'RECEIVED',
      received_at: new Date().toISOString(),
    })

  if (eventInsertError?.code === '23505') {
    return ok({ received: true, duplicate: true })
  }
  if (eventInsertError) {
    return err('SERVER_ERROR', eventInsertError.message, 500)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const providerSessionId = typeof object.id === 'string' ? object.id : null
      if (providerSessionId) {
        await markCheckoutSessionStatus(db, 'STRIPE', providerSessionId, 'COMPLETED', {
          stripe_customer_id: object.customer ?? null,
          stripe_subscription_id: object.subscription ?? null,
          completed_at: new Date().toISOString(),
        })
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const providerSubscriptionId = typeof object.id === 'string' ? object.id : null
      const providerCustomerId = typeof object.customer === 'string' ? object.customer : null
      const items = (((object.items as Record<string, unknown> | undefined)?.data ?? []) as Array<Record<string, unknown>>)
      const firstItem = items[0] ?? {}
      const firstPrice = (firstItem.price ?? {}) as Record<string, unknown>
      const providerPriceId = typeof firstPrice.id === 'string' ? firstPrice.id : null
      const amount = Number(firstPrice.unit_amount ?? 0) / 100
      const currency = String(firstPrice.currency ?? 'myr').toUpperCase()
      const recurring = (firstPrice.recurring ?? {}) as Record<string, unknown>
      const recurringInterval = String(recurring.interval ?? '').toLowerCase()
      const interval =
        recurringInterval === 'year'
          ? 'YEAR'
          : recurringInterval === 'month'
            ? 'MONTH'
            : null

      if (orgId && providerCustomerId && providerSubscriptionId) {
        const customer = await ensureBillingCustomer(db, {
          orgId,
          provider: 'STRIPE',
          providerCustomerId,
          customerEmail: typeof object.customer_email === 'string' ? object.customer_email : null,
          customerName: typeof object.customer_name === 'string' ? object.customer_name : null,
        })

        const planResolution = await resolvePlanByProviderPrice(db, 'STRIPE', providerPriceId)

        const { error } = await db
          .from('billing_subscriptions')
          .upsert(
            {
              org_id: orgId,
              billing_customer_id: customer.id,
              plan_id: planResolution.plan?.id ?? null,
              provider: 'STRIPE',
              provider_subscription_id: providerSubscriptionId,
              provider_price_id: providerPriceId,
              status: mapStripeSubscriptionStatus(typeof object.status === 'string' ? object.status : null),
              currency,
              amount,
              interval,
              started_at: unixToIso(Number(object.start_date ?? 0)),
              current_period_start: unixToIso(Number(object.current_period_start ?? 0)),
              current_period_end: unixToIso(Number(object.current_period_end ?? 0)),
              trial_start: unixToIso(Number(object.trial_start ?? 0)),
              trial_end: unixToIso(Number(object.trial_end ?? 0)),
              cancel_at_period_end: Boolean(object.cancel_at_period_end),
              canceled_at: unixToIso(Number(object.canceled_at ?? 0)),
              ended_at: unixToIso(Number(object.ended_at ?? 0)),
              metadata: object,
            },
            { onConflict: 'provider,provider_subscription_id' }
          )

        if (error) throw new Error(error.message)
      }
    }

    if (
      event.type === 'invoice.paid' ||
      event.type === 'invoice.payment_succeeded' ||
      event.type === 'invoice.payment_failed'
    ) {
      const providerInvoiceId = typeof object.id === 'string' ? object.id : null
      const providerSubscriptionId = typeof object.subscription === 'string' ? object.subscription : null
      const providerCustomerId = typeof object.customer === 'string' ? object.customer : null

      if (orgId && providerInvoiceId) {
        let billingCustomerId: string | null = null

        if (providerCustomerId) {
          const customer = await ensureBillingCustomer(db, {
            orgId,
            provider: 'STRIPE',
            providerCustomerId,
            customerEmail: typeof object.customer_email === 'string' ? object.customer_email : null,
            customerName: typeof object.customer_name === 'string' ? object.customer_name : null,
          })
          billingCustomerId = customer.id
        }

        const { data: subscription } = providerSubscriptionId
          ? await db
              .from('billing_subscriptions')
              .select('id')
              .eq('provider', 'STRIPE')
              .eq('provider_subscription_id', providerSubscriptionId)
              .maybeSingle()
          : { data: null }

        const invoiceStatus =
          event.type === 'invoice.payment_failed'
            ? 'FAILED'
            : 'PAID'

        const { data: invoice, error: invoiceError } = await db
          .from('billing_invoices')
          .upsert(
            {
              org_id: orgId,
              subscription_id: subscription?.id ?? null,
              provider: 'STRIPE',
              provider_invoice_id: providerInvoiceId,
              provider_payment_id: typeof object.charge === 'string' ? object.charge : null,
              invoice_number: typeof object.number === 'string' ? object.number : null,
              status: invoiceStatus,
              currency: String(object.currency ?? 'myr').toUpperCase(),
              amount_subtotal: Number(object.subtotal ?? 0) / 100,
              amount_tax: Number(object.tax ?? 0) / 100,
              amount_discount: Number(object.total_discount_amounts ? 0 : 0),
              amount_due: Number(object.amount_due ?? 0) / 100,
              amount_paid: Number(object.amount_paid ?? 0) / 100,
              invoice_url: typeof object.hosted_invoice_url === 'string' ? object.hosted_invoice_url : null,
              invoice_pdf_url: typeof object.invoice_pdf === 'string' ? object.invoice_pdf : null,
              issued_at: unixToIso(Number(object.created ?? 0)),
              due_at: unixToIso(Number(object.due_date ?? 0)),
              paid_at: invoiceStatus === 'PAID' ? new Date().toISOString() : null,
              raw_payload: {
                ...object,
                billing_customer_id: billingCustomerId,
              },
            },
            { onConflict: 'provider,provider_invoice_id' }
          )
          .select('id, amount_paid, currency')
          .single()

        if (invoiceError) throw new Error(invoiceError.message)

        if (invoiceStatus === 'PAID' && invoice) {
          await maybeCreateCommissionForPaidInvoice(db, {
            orgId,
            invoiceId: invoice.id,
            subscriptionId: subscription?.id ?? null,
            amountPaid: Number(invoice.amount_paid ?? 0),
            currency: invoice.currency ?? 'MYR',
          })
        }
      }
    }

    if (orgId) {
      await syncSubscriptionStatusSnapshot(db, orgId)
    }

    await db
      .from('billing_events')
      .update({
        processing_status: 'PROCESSED',
        processed_at: new Date().toISOString(),
      })
      .eq('provider', 'STRIPE')
      .eq('provider_event_id', event.id)

    return ok({ received: true })
  } catch (error) {
    await db
      .from('billing_events')
      .update({
        processing_status: 'FAILED',
        last_error: error instanceof Error ? error.message : 'Unknown webhook error',
        processed_at: new Date().toISOString(),
      })
      .eq('provider', 'STRIPE')
      .eq('provider_event_id', event.id)

    return err(
      'WEBHOOK_PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unknown webhook error.',
      500
    )
  }
}
