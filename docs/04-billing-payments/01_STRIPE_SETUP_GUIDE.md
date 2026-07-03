# Stripe Setup Guide — myexpensio
### For founders and non-programmers. No prior coding knowledge needed.

**Corrected 2026-07-02 (Sprint 25):** an earlier version of this guide told you to create `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` and never mentioned PREMIUM at all. The actual checkout code (`apps/user/app/api/billing/checkout/route.ts`) reads `STRIPE_PRICE_PRO` and `STRIPE_PRICE_PREMIUM` instead — one price per tier, no monthly/yearly choice (the checkout API doesn't accept an interval parameter today). Following the old guide exactly would leave checkout broken with a `CONFIG_ERROR`. This version matches the code.

---

## What This Guide Covers

By the end of this guide, Stripe will be fully wired into myexpensio so that:
- Customers can subscribe to **Pro (RM18/month)** or **Premium (RM29/month)**
- Payments are processed securely by Stripe
- Your Supabase database automatically updates when someone pays, cancels, or fails to pay
- You can test everything safely before going live

---

## Before You Start — What You Need

- [ ] A computer with internet access
- [ ] A Stripe account (we create one in Step 1)
- [ ] Access to your **Vercel dashboard** (where myexpensio is deployed)
- [ ] About 45–60 minutes

---

## Part 1 — Create Your Stripe Account

### Step 1 — Sign up for Stripe

1. Go to **https://stripe.com**
2. Click **Start now** (top right)
3. Enter your email, full name, country, and a password
4. Click **Create account**
5. Check your email and click the verification link Stripe sends you
6. Complete the business onboarding — fill in your business name, type, and banking details
   > **Note:** You do not need to complete the full business verification to use test mode. You can test payments immediately after account creation.

---

## Part 2 — Install the Stripe CLI

The Stripe CLI is a small program you install on your computer. It lets you create products, listen for payment events, and test webhooks without touching any code.

### Step 2 — Install Stripe CLI on Windows

1. Go to **https://github.com/stripe/stripe-cli/releases/latest**
2. Under **Assets**, download the file named `stripe_X.X.X_windows_x86_64.zip`
3. Extract (unzip) the downloaded file — you will get a file called `stripe.exe`
4. Move `stripe.exe` to a folder such as `C:\stripe\`
5. Add it to your PATH so you can run it from anywhere:
   - Press `Windows key + S`, search for **"Edit the system environment variables"**, open it
   - Click **Environment Variables**
   - Under **System variables**, find **Path**, click **Edit**
   - Click **New**, type `C:\stripe\`, click **OK** on all windows
6. Open a new **Command Prompt** (press `Windows key + R`, type `cmd`, press Enter)
7. Type the following and press Enter to confirm it works:
   ```
   stripe --version
   ```
   You should see something like `stripe version 1.x.x`

> **Mac users:** Open Terminal and run:
> ```
> brew install stripe/stripe-cli/stripe
> ```
> If you don't have Homebrew: go to **https://brew.sh** and follow the one-line install instruction first.

---

### Step 3 — Log in to Stripe CLI

In your Command Prompt or Terminal, run:

```
stripe login
```

This will open a browser window asking you to confirm the connection.
Click **Allow access**. You will see `Done! The Stripe CLI is configured` in your terminal.

---

## Part 3 — Create Your Products and Prices (Test Mode)

You will now create **two** recurring monthly prices in Stripe's **test mode** first — one for Pro, one for Premium. Test mode uses fake money — nothing real is charged.

> **No yearly prices needed.** The checkout code only supports one price per tier (monthly). If you want yearly billing later, that's a code change to `checkout/route.ts` first — don't create yearly prices in Stripe until that's built, or you'll have unused prices sitting in your dashboard.

### Step 4 — Create the Pro Monthly Price

In your Command Prompt, run this command. Replace `1800` with your actual monthly price **in cents** (RM 18.00 = `1800`):

```
stripe prices create --unit-amount=1800 --currency=myr --recurring[interval]=month --product-data[name]="myexpensio Pro" --nickname="Pro Monthly"
```

After running, you will see output like this:
```
{
  "id": "price_1ABC123...",
  "nickname": "Pro Monthly",
  ...
}
```

**Copy the `id` value** (starts with `price_`). This is your **STRIPE_PRICE_PRO**.

> Change `--currency=myr` to `--currency=usd` or whichever currency your business uses.

---

### Step 5 — Create the Premium Monthly Price

Run this command. Replace `2900` with your actual monthly price **in cents** (RM 29.00 = `2900`):

```
stripe prices create --unit-amount=2900 --currency=myr --recurring[interval]=month --product-data[name]="myexpensio Premium" --nickname="Premium Monthly"
```

**Copy the `id` value** from the output. This is your **STRIPE_PRICE_PREMIUM**.

---

### Step 6 — Get Your Secret API Key (Test Mode)

1. Go to **https://dashboard.stripe.com**
2. Make sure the toggle at the top says **Test mode** (not Live mode)
3. In the left sidebar, click **Developers** → **API keys**
4. You will see a **Secret key** that starts with `sk_test_`
5. Click **Reveal test key**, then copy the full key

This is your **STRIPE_SECRET_KEY** (test version).

---

## Part 4 — Set Up the Webhook (Test Mode)

Webhooks are how Stripe tells your app "someone just paid" or "a subscription was cancelled." This is the most important part — one webhook handles both Pro and Premium (and both USER and ORG subscriptions), so you only set this up once.

### Step 7 — Start the Webhook Listener (for local testing only)

> **Skip this step if you are setting up directly for production on Vercel.** This step is only needed if you want to test on your local computer.

In your Command Prompt, run:

```
stripe listen --forward-to localhost:3100/api/billing/webhook
```

You will see a line like:
```
> Ready! Your webhook signing secret is whsec_abc123...
```

**Copy that `whsec_...` value**. This is your **STRIPE_WEBHOOK_SECRET** for local testing.

Leave this terminal window open while you test.

---

### Step 8 — Create a Webhook in Stripe Dashboard (for Production)

This is the permanent webhook for your live Vercel deployment.

1. Go to **https://dashboard.stripe.com**
2. In the left sidebar, click **Developers** → **Webhooks**
3. Click **Add endpoint**
4. In the **Endpoint URL** field, enter:
   ```
   https://YOUR-USER-APP-DOMAIN/api/billing/webhook
   ```
   Replace `YOUR-USER-APP-DOMAIN` with your actual user app URL from Vercel (e.g. `app.myexpensio.com` or `myexpensio-user.vercel.app`)
5. Under **Select events**, click **Select events** and tick these five:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Click **Add events**, then click **Add endpoint**
7. On the webhook detail page, click **Reveal** under **Signing secret**
8. **Copy the `whsec_...` value** — this is your **STRIPE_WEBHOOK_SECRET** for production

---

## Part 5 — Add Environment Variables to Vercel

This is where you tell your live app all the keys it needs. Think of environment variables as secret settings that live on the server, not in the code.

### Step 9 — Open Your Vercel Project Settings

1. Go to **https://vercel.com/dashboard**
2. Find and click on your **User App** project (the one your customers use)
3. Click the **Settings** tab at the top
4. In the left sidebar, click **Environment Variables**

---

### Step 10 — Add Each Variable

Click **Add New** for each variable below. Set **Environment** to **Production** (and optionally **Preview**). These are the exact names the code reads — don't rename them.

| Variable Name | Value | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Step 8 above |
| `STRIPE_PRICE_PRO` | `price_...` | Output from Step 4 |
| `STRIPE_PRICE_PREMIUM` | `price_...` | Output from Step 5 |

> **Only 4 variables needed.** There's no separate "amount" env var like an earlier version of this guide had — the display price shown on the billing page is hardcoded in `apps/user/app/(app)/settings/billing/page.tsx` (`PLANS` array), not read from an env var. If you change the actual Stripe price, update that hardcoded number too so the UI matches what Stripe will actually charge.

---

### Step 11 — Redeploy the App

After adding all variables, Vercel needs to restart your app to pick them up.

1. Click the **Deployments** tab in your Vercel project
2. Click the three dots (`...`) next to the most recent deployment
3. Click **Redeploy**
4. Wait 1–2 minutes for it to finish

---

## Part 6 — Test That Everything Works

### Step 12 — Test a Checkout (Stripe Test Mode)

1. Open your user app in a browser, go to **Settings → Plan & Billing**
2. Log in as a test user
3. Select **Pro**, click **Continue to payment**
4. You will be redirected to a Stripe Checkout page
5. Use Stripe's test card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/29`)
   - CVC: any 3 digits (e.g. `123`)
   - Name: anything
6. Click **Pay**
7. You should be redirected back to your app and see the Pro plan activated
8. **Repeat for Premium** — select Premium instead of Pro and confirm it activates correctly too (this wasn't tested under the old guide since it never mentioned Premium)

> If the checkout page does not appear, double-check that your environment variables are saved correctly in Vercel and that you redeployed.

---

### Step 13 — Confirm the Subscription in Stripe

1. Go to **https://dashboard.stripe.com** (in Test mode)
2. Click **Customers** in the left sidebar
3. You should see the test customer created during checkout
4. Click on them and confirm there is an active subscription
5. For the Premium test: also check in Supabase that a `BUSINESS` space was auto-created for that user (the webhook does this automatically on Premium activation — see `apps/user/app/api/billing/webhook/route.ts`)

---

## Part 7 — Go Live (Real Payments)

Once you have tested everything and are confident it works, switch to live mode.

### Step 14 — Activate Your Stripe Account

1. Go to **https://dashboard.stripe.com**
2. Click the **Activate your account** banner (if not already done)
3. Complete all business verification steps — Stripe will ask for:
   - Business type and registration details
   - Bank account for payouts
   - Identity verification (NRIC or passport)
4. Wait for Stripe to approve your account (usually same day to 2 days) — **this has the longest lead time of anything in this guide, start it early**

---

### Step 15 — Create Live Products and Prices

Switch to **Live mode** in the Stripe Dashboard (toggle at the top), then repeat Steps 4 and 5 but first run in your Command Prompt:

```
stripe login
```

Then create both prices the same way — the commands are identical. You will get new live `price_...` IDs.

Alternatively, do it directly in the Stripe Dashboard:
1. Go to **Products** → **Add product**
2. Create "myexpensio Pro" (RM18/month) and "myexpensio Premium" (RM29/month) as two separate products/prices
3. Copy both live price IDs

---

### Step 16 — Get Your Live Secret Key

1. In Stripe Dashboard, switch to **Live mode**
2. Go to **Developers** → **API keys**
3. Copy the **Secret key** (starts with `sk_live_`)

---

### Step 17 — Create a Live Webhook

Repeat Step 8 exactly, but this time make sure you are in **Live mode** in the Stripe Dashboard. The endpoint URL stays the same — your production app URL.

---

### Step 18 — Update Vercel Environment Variables with Live Keys

Go back to your Vercel project → Settings → Environment Variables and **update** (not add) these four variables with the live values:

| Variable Name | Replace with |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (live secret key) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (live webhook signing secret) |
| `STRIPE_PRICE_PRO` | Live Pro price ID |
| `STRIPE_PRICE_PREMIUM` | Live Premium price ID |

Then **redeploy** again (Step 11).

Finally: do **one real low-value test transaction in live mode**, confirm it activates correctly, then refund it from the Stripe Dashboard before telling real customers it's live.

---

## Quick Reference — All 4 Environment Variables

| Variable | Test Value Example | Live Value Example |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_51...` | `sk_live_51...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test...` | `whsec_live...` |
| `STRIPE_PRICE_PRO` | `price_1ABC...` (Pro, RM18/mo) | `price_1XYZ...` |
| `STRIPE_PRICE_PREMIUM` | `price_1DEF...` (Premium, RM29/mo) | `price_1UVW...` |

---

## Troubleshooting

**"Stripe is not configured" error in the app**
→ One or more environment variables are missing in Vercel. Check Step 10 and redeploy.

**Checkout page appears but payment fails**
→ Make sure you are using test card `4242 4242 4242 4242` in test mode. Real cards only work in live mode.

**Webhook events not received**
→ Confirm the webhook URL in Stripe Dashboard matches your app's URL exactly, including `https://` and ending with `/api/billing/webhook`. Check that the five events listed in Step 8 are all ticked.

**Subscription not activating after payment**
→ The webhook is likely not reaching your app. Go to Stripe Dashboard → Developers → Webhooks → click your endpoint → check the **Attempts** tab for errors.

**"STRIPE_PRICE_PRO env var not set" / "STRIPE_PRICE_PREMIUM env var not set" error**
→ The exact env var name matters — it must be `STRIPE_PRICE_PRO` / `STRIPE_PRICE_PREMIUM`, not `STRIPE_PRO_MONTHLY_PRICE_ID` or any other name. Re-check Step 10.

**Premium checkout works but no Business Space appears**
→ Check the webhook logs (Stripe Dashboard → Developers → Webhooks → your endpoint → Attempts) for errors on the `checkout.session.completed` event — that's what triggers the auto-created Business Space.

---

*Guide written for myexpensio — corrected 2026-07-02 (Sprint 25) to match the actual code. See `docs/SHIP_READINESS_ACTION_PLAN.md` §1.1 for what's still pending.*
