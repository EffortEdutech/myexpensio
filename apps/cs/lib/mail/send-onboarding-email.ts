// apps/cs/lib/mail/send-onboarding-email.ts
// Sends a welcome / onboarding email to a newly created employee.
// Called from the CS Console execute flow when a new user is created.
//
// Required env vars (already in .env.local and Vercel):
//   GMAIL_SMTP_USER          effort.myexpensio@gmail.com
//   GMAIL_SMTP_APP_PASSWORD  Gmail App Password
//   MAIL_FROM_NAME           Display name for the From field

import nodemailer from 'nodemailer'

export type SendOnboardingEmailInput = {
  to: string
  orgName: string
  tempPassword: string
  loginUrl: string
  displayName?: string | null
  defaultRateTemplateName?: string | null
}

let transporter: nodemailer.Transporter | null = null

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

function getTransporter() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: getRequiredEnv('GMAIL_SMTP_USER'),
      pass: getRequiredEnv('GMAIL_SMTP_APP_PASSWORD'),
    },
  })
  return transporter
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const smtpUser = getRequiredEnv('GMAIL_SMTP_USER')
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'myexpensio'

  const safeOrg      = escapeHtml(input.orgName)
  const safeLogin    = escapeHtml(input.loginUrl)
  const safeEmail    = escapeHtml(input.to)
  const safePassword = escapeHtml(input.tempPassword)
  const safeName     = input.displayName?.trim() ? escapeHtml(input.displayName.trim()) : safeEmail
  const safeRate     = input.defaultRateTemplateName?.trim()
    ? escapeHtml(input.defaultRateTemplateName.trim())
    : 'Assigned by admin'

  const subject = `Your myexpensio account for ${input.orgName}`

  const text = [
    `Hello ${safeName},`,
    '',
    `Your myexpensio account has been created for ${input.orgName}.`,
    '',
    `Login URL: ${input.loginUrl}`,
    `Email:     ${input.to}`,
    `Temporary password: ${input.tempPassword}`,
    `Default rate template: ${input.defaultRateTemplateName ?? 'Assigned by admin'}`,
    '',
    'After your first login you will be asked to set a new password.',
    'Then go to Settings to complete your profile:',
    '  1. Review / update your mileage rate',
    '  2. Set your department and location',
    '  3. Set your company name',
    '',
    'Regards,',
    fromName,
  ].join('\n')

  const html = `
<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:520px;">
  <p>Hello <strong>${safeName}</strong>,</p>
  <p>Your <strong>myexpensio</strong> account has been created for <strong>${safeOrg}</strong>.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Login URL:</strong> <a href="${safeLogin}">${safeLogin}</a></p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
    <p style="margin:0 0 8px;"><strong>Temporary password:</strong>
      <code style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:2px 6px;font-size:14px;">${safePassword}</code>
    </p>
    <p style="margin:0;"><strong>Default rate template:</strong> ${safeRate}</p>
  </div>

  <p>
    After your first login you will be asked to <strong>set a new password</strong>.<br/>
    Then go to <strong>Settings</strong> to complete your profile:
  </p>
  <ol style="padding-left:20px;margin:8px 0;">
    <li>Review / update your mileage rate</li>
    <li>Set your department and location</li>
    <li>Set your company name</li>
  </ol>

  <p style="margin-top:24px;color:#6b7280;font-size:13px;">
    Regards,<br/>${escapeHtml(fromName)}
  </p>
</div>`

  const info = await getTransporter().sendMail({
    from: `"${fromName}" <${smtpUser}>`,
    to: input.to,
    subject,
    text,
    html,
  })

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }
}
