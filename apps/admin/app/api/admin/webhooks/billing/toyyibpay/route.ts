import { randomUUID } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'
import { syncSubscriptionStatusSnapshot } from '@/lib/billing/sync'
import {
  ensureBillingCustomer,
  maybeCreateCommissionForPaidInvoice,
} from '@/lib/billing/providers'

function valueOf(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return null
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
    : Object.fromEntries(
        Array.from((await request.formData()).entries()).map(([key, value]) => [key, String(value)])
      )

  const expectedToken = process.env.TOYYIBPAY_CALLBACK_TOKEN
  const receivedToken =
    request.headers.get('x-callback-token') ??
    valueOf(payload, 'callback_token', 'token', 'secret')

  if (expectedToken && receivedToken !== expectedToken) {
    return err('INVALID_SIGNATURE', 'ToyyibPay callback token mismatch.', 400)
  }

  const providerEventId =
    valueOf(payload, 'transaction_id', 'refno', 'billcode', 'order_id') ??
    randomUUID()

  const billCode = valueOf(payload, 'billcode', 'billCode')
  const externalRef = valueOf(payload, 'order_id', 'billExternalReferenceNo', 'external_reference_no')
  const statusId = valueOf(payload, 'status_id', 'status') ?? '0'

  const db = createServiceRoleClient()

  const { error: eventInsertError } = await db
    .from('billing_events')
    .insert({
      provider: 'TOYYIBPAY',
      provider_event_id: providerEventId,
      event_type: 'payment_callback',
      payload,
      processing_status: 'RECEIVED',
      received_at: new Date().toISOString(),
    })

  if (eventInsertError?.code === '23505') {
    return ok({ received: true, duplicate: true })
  }
  if (eventInsertError) return err('SERVER_ERROR', eventInsertError.message, 500)

  try {
    let checkoutSession: Record<string, unknown> | null = null

    if (externalRef) {
      const { data } = await db
        .from('billing_checkout_sessions')
        .select('id, org_id, user_id, plan_id, price_id, provider, provider_session_id, metadata')
        .eq('id', externalRef)
        .maybeSingle()
      checkoutSession = data ?? null
    }

    if (!checkoutSession && billCode) {
      const { data } = await db
        .from('billing_checkout_sessions')
        .select('id, org_id, user_id, plan_id, price_id, provider, provider_session_id, metadata')
        .eq('provider', 'TOYYIBPAY')
        .eq('provider_session_id', billCode)
        .maybeSingle()
      checkoutSession = data ?? null
    }

    const paid = statusId === '1'
    const orgId = typeof checkoutSession?.org_id === 'string' ? checkoutSession.org_id : null

    if (billCode) {
      await db
        .from('billing_checkout_sessions')
        .update({
          status: paid ? 'COMPLETED' : 'FAILED',
          completed_at: paid ? new Date().toISOString() : null,
          metadata: {
            ...(((checkoutSession?.metadata as Record<string, unknown> | null) ?? {})),
            toyyibpay_payload: payload,
          },
        })
        .eq('provider', 'TOYYIBPAY')
        .eq('provider_session_id', billCode)
    }

    if (orgId && checkoutSession) {
      const { data: plan } = await db
        .from('billing_plans')
        .select('id, code, tier, interval')
        .eq('id', String(checkoutSession.plan_id))
        .maybeSingle()

      const { data: price } = checkoutSession.price_id
        ? await db
            .from('billing_prices')
            .select('id, amount, currency, interval')
            .eq('id', String(checkoutSession.price_id))
            .maybeSingle()
        : { data: null }

      const customer = await ensureBillingCustomer(db, {
        orgId,
        provider: 'TOYYIBPAY',
        providerCustomerId: valueOf(payload, 'email', 'bill_email') ?? `org:${orgId}`,
        customerEmail: valueOf(payload, 'email', 'bill_email'),
        customerName: valueOf(payload, 'name', 'bill_to'),
      })

      const providerSubscriptionId = `toyyib:${billCode ?? externalRef ?? providerEventId}`

      const { data: subscription, error: subscriptionError } = await db
        .from('billing_subscriptions')
        .upsert(
          {
            org_id: orgId,
            billing_customer_id: customer.id,
            plan_id: plan?.id ?? String(checkoutSession.plan_id),
            provider: 'TOYYIBPAY',
            provider_subscription_id: providerSubscriptionId,
            provider_price_id: null,
            status: paid ? 'ACTIVE' : 'PAST_DUE',
            currency: price?.currency ?? 'MYR',
            amount: Number(price?.amount ?? 0),
            interval: price?.interval ?? plan?.interval ?? null,
            started_at: new Date().toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: null,
            metadata: payload,
          },
          { onConflict: 'provider,provider_subscription_id' }
        )
        .select('id')
        .single()

      if (subscriptionError) throw new Error(subscriptionError.message)

      const amountPaid = Number(valueOf(payload, 'amount', 'bill_amount') ?? 0)
      const normalizedAmount = amountPaid > 1000 ? Number((amountPaid / 100).toFixed(2)) : amountPaid

      const { data: invoice, error: invoiceError } = await db
        .from('billing_invoices')
        .upsert(
          {
            org_id: orgId,
            subscription_id: subscription?.id ?? null,
            provider: 'TOYYIBPAY',
            provider_invoice_id: providerEventId,
            provider_payment_id: providerEventId,
            invoice_number: billCode,
            status: paid ? 'PAID' : 'FAILED',
            currency: price?.currency ?? 'MYR',
            amount_subtotal: normalizedAmount,
            amount_due: normalizedAmount,
            amount_paid: paid ? normalizedAmount : 0,
            invoice_url: billCode ? `${(process.env.TOYYIBPAY_BASE_URL ?? 'https://dev.toyyibpay.com').replace(/\/$/, '')}/${billCode}` : null,
            paid_at: paid ? new Date().toISOString() : null,
            raw_payload: payload,
          },
          { onConflict: 'provider,provider_invoice_id' }
        )
        .select('id, amount_paid, currency')
        .single()

      if (invoiceError) throw new Error(invoiceError.message)

      if (paid && invoice) {
        await maybeCreateCommissionForPaidInvoice(db, {
          orgId,
          invoiceId: invoice.id,
          subscriptionId: subscription?.id ?? null,
          amountPaid: Number(invoice.amount_paid ?? 0),
          currency: invoice.currency ?? 'MYR',
        })
      }

      await syncSubscriptionStatusSnapshot(db, orgId)
    }

    await db
      .from('billing_events')
      .update({
        processing_status: 'PROCESSED',
        processed_at: new Date().toISOString(),
      })
      .eq('provider', 'TOYYIBPAY')
      .eq('provider_event_id', providerEventId)

    return ok({ received: true })
  } catch (error) {
    await db
      .from('billing_events')
      .update({
        processing_status: 'FAILED',
        last_error: error instanceof Error ? error.message : 'Unknown webhook error',
        processed_at: new Date().toISOString(),
      })
      .eq('provider', 'TOYYIBPAY')
      .eq('provider_event_id', providerEventId)

    return err(
      'WEBHOOK_PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unknown webhook error.',
      500
    )
  }
}
