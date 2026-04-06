// apps/admin/lib/mail/send-onboarding-email.ts

import nodemailer from 'nodemailer'

type SendOnboardingEmailInput = {
  to: string
  orgName: string
  tempPassword: string
  loginUrl: string
  displayName?: string | null
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
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const smtpUser = getRequiredEnv('GMAIL_SMTP_USER')
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'myexpensio'

  const safeOrgName = escapeHtml(input.orgName)
  const safeLoginUrl = escapeHtml(input.loginUrl)
  const safeEmail = escapeHtml(input.to)
  const safePassword = escapeHtml(input.tempPassword)
  const safeDisplayName = input.displayName?.trim()
    ? escapeHtml(input.displayName.trim())
    : safeEmail

  const subject = `Your myexpensio account for ${input.orgName}`

  const text = [
    `Assalamualaikum / Hello ${safeDisplayName},`,
    '',
    `Your myexpensio account has been created for ${input.orgName}.`,
    '',
    `Login URL: ${input.loginUrl}`,
    `Email: ${input.to}`,
    `Temporary password: ${input.tempPassword}`,
    '',
    'After you log in, please go to Settings and change your password immediately.',
    '',
    'Regards,',
    fromName,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
      <p>Assalamualaikum / Hello <strong>${safeDisplayName}</strong>,</p>

      <p>Your <strong>myexpensio</strong> account has been created for <strong>${safeOrgName}</strong>.</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;"><strong>Login URL:</strong> <a href="${safeLoginUrl}">${safeLoginUrl}</a></p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0;"><strong>Temporary password:</strong> <code style="font-size:14px;">${safePassword}</code></p>
      </div>

      <p>After you log in, please go to <strong>Settings</strong> and change your password immediately.</p>

      <p style="margin-top:24px;">Regards,<br/>${escapeHtml(fromName)}</p>
    </div>
  `

  const info = await getTransporter().sendMail({
    from: `"${fromName}" <${smtpUser}>`,
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