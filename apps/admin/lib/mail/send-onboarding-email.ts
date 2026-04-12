// apps/admin/lib/mail/send-onboarding-email.ts

import nodemailer from 'nodemailer'

type SendOnboardingEmailInput = {
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

  const user = getRequiredEnv('GMAIL_SMTP_USER')
  const pass = getRequiredEnv('GMAIL_SMTP_APP_PASSWORD')

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const smtpUser = getRequiredEnv('GMAIL_SMTP_USER')
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'myexpensio - trusted assistant for your expenses'

  const safeOrgName = escapeHtml(input.orgName)
  const safeLoginUrl = escapeHtml(input.loginUrl)
  const safeEmail = escapeHtml(input.to)
  const safePassword = escapeHtml(input.tempPassword)
  const safeDisplayName = input.displayName?.trim()
    ? escapeHtml(input.displayName.trim())
    : safeEmail
  const safeDefaultRateTemplateName = input.defaultRateTemplateName?.trim()
    ? escapeHtml(input.defaultRateTemplateName.trim())
    : 'the assigned default rate template'

  const subject = `Your myexpensio account for ${input.orgName}`

  const text = [
    `Hello ${safeDisplayName},`,
    '',
    `Your myexpensio account has been created for ${input.orgName}.`,
    '',
    `Login URL: ${input.loginUrl}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.tempPassword}`,
    `Default rate template assigned: ${input.defaultRateTemplateName ?? 'Assigned by admin'}`,
    '',
    'After your first login, please go to Settings and complete these items so the app can run smoothly:',
    '1. Change your password',
    '2. Review / update your rate',
    '3. Set your department and location',
    '4. Set your company name',
    '',
    'Regards,',
    fromName,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hello <strong>${safeDisplayName}</strong>,</p>

      <p>Your <strong>myexpensio</strong> account has been created for <strong>${safeOrgName}</strong>.</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;"><strong>Login URL:</strong> <a href="${safeLoginUrl}">${safeLoginUrl}</a></p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 8px;"><strong>Temporary password:</strong> <code style="font-size:14px;">${safePassword}</code></p>
        <p style="margin:0;"><strong>Default rate template assigned:</strong> ${safeDefaultRateTemplateName}</p>
      </div>

      <p>After your first login, please go to <strong>Settings</strong> and complete these items so the app can run smoothly:</p>

      <ol style="padding-left:20px; margin:12px 0;">
        <li>Change your password</li>
        <li>Review / update your rate</li>
        <li>Set your department and location</li>
        <li>Set your company name</li>
      </ol>

      <p style="margin-top:24px;">Regards,<br/>${escapeHtml(fromName)}</p>
    </div>
  `

  const info = await getTransporter().sendMail({
    from: `\"${fromName}\" <${smtpUser}>`,
    to: input.to,
    subject,
    text,
    html,
  })

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  }
}
