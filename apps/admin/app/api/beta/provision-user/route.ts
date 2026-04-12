// apps/admin/app/api/beta/provision-user/route.ts

import { type NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import {
  createAdminClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'
import { sendOnboardingEmail } from '@/lib/mail/send-onboarding-email'

type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER'

type RateTemplateRow = {
  id: string
  template_name: string | null
  effective_from: string | null
  currency: string | null
  mileage_rate_per_km: number | null
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  perdiem_rate_myr: number | null
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeOrgRole(value: unknown): OrgRole {
  const v = String(value ?? 'MEMBER').trim().toUpperCase()
  if (v === 'OWNER' || v === 'MANAGER' || v === 'MEMBER') return v
  throw new Error('org_role must be OWNER, MANAGER, or MEMBER.')
}

function makeTempPassword(email: string): string {
  const local = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  const first2 = (local.slice(0, 2) || 'ux').padEnd(2, 'x')
  const len = String(local.length).padStart(2, '0')
  const rand = randomBytes(4)
    .toString('base64url')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 4)

  return `Mx-${first2}${len}-${rand}!`
}

async function resolveActor() {
  const adminClient = await createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser()

  if (authError || !user) {
    return { error: err('UNAUTHENTICATED', 'Admin login required.', 401) as NextResponse }
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'ADMIN') {
    return { error: err('FORBIDDEN', 'Admin access required.', 403) as NextResponse }
  }

  return {
    actor: {
      id: user.id,
      email: user.email ?? profile.email ?? null,
    },
  }
}

async function resolveOrganisation(
  service: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
) {
  const { data, error } = await service
    .from('organizations')
    .select('id, name, status')
    .eq('id', orgId)
    .single()

  if (error || !data) {
    throw new Error('Selected organisation was not found.')
  }

  if (data.status && data.status !== 'ACTIVE') {
    throw new Error('Selected organisation is not active.')
  }

  return data
}

async function findExistingProfileByEmail(
  service: ReturnType<typeof createServiceRoleClient>,
  email: string,
) {
  const { data, error } = await service
    .from('profiles')
    .select('id, email, display_name, role')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to check existing profile: ${error.message}`)
  }

  return data
}

async function upsertProfile(params: {
  service: ReturnType<typeof createServiceRoleClient>
  userId: string
  email: string
  displayName: string
}) {
  const { service, userId, email, displayName } = params

  const { error } = await service.from('profiles').upsert(
    {
      id: userId,
      email,
      display_name: displayName,
      role: 'USER',
    },
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`)
  }
}

async function upsertOrgMember(params: {
  service: ReturnType<typeof createServiceRoleClient>
  orgId: string
  userId: string
  orgRole: OrgRole
}) {
  const { service, orgId, userId, orgRole } = params

  const withStatus = await service.from('org_members').upsert(
    {
      org_id: orgId,
      user_id: userId,
      org_role: orgRole,
      status: 'ACTIVE',
    },
    { onConflict: 'org_id,user_id' },
  )

  if (!withStatus.error) return

  const withoutStatus = await service.from('org_members').upsert(
    {
      org_id: orgId,
      user_id: userId,
      org_role: orgRole,
    },
    { onConflict: 'org_id,user_id' },
  )

  if (withoutStatus.error) {
    throw new Error(`Failed to upsert org member: ${withoutStatus.error.message}`)
  }
}

async function ensureFreeSubscription(
  service: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
) {
  const withDates = await service.from('subscription_status').upsert(
    {
      org_id: orgId,
      tier: 'FREE',
      period_start: new Date().toISOString().slice(0, 10),
      period_end: null,
    },
    { onConflict: 'org_id' },
  )

  if (!withDates.error) return

  const basic = await service.from('subscription_status').upsert(
    {
      org_id: orgId,
      tier: 'FREE',
    },
    { onConflict: 'org_id' },
  )

  if (basic.error) {
    throw new Error(`Failed to ensure subscription_status: ${basic.error.message}`)
  }
}

async function resolveRateTemplate(
  service: ReturnType<typeof createServiceRoleClient>,
  rateVersionId: string,
) {
  const { data, error } = await service
    .from('rate_versions')
    .select(`
      id,
      org_id,
      template_name,
      effective_from,
      currency,
      mileage_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr
    `)
    .eq('id', rateVersionId)
    .single()

  if (error || !data) {
    throw new Error('Selected rate template was not found.')
  }

  return data
}

async function ensureDefaultUserRate(params: {
  service: ReturnType<typeof createServiceRoleClient>
  orgId: string
  userId: string
  actorUserId: string
  sourceRateVersionId: string
}) {
  const { service, orgId, userId, actorUserId, sourceRateVersionId } = params

  const { data: existing, error: existingError } = await service
    .from('user_rate_versions')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Failed to check user default rate: ${existingError.message}`)
  }

  if (existing) {
    return { seeded: false, reason: 'EXISTS' as const }
  }

  const template = await resolveRateTemplate(service, sourceRateVersionId)
  const effectiveFrom = new Date().toISOString().slice(0, 10)

  const matchedSourceRateVersionId =
    template.org_id && template.org_id === orgId ? template.id : null

  const { error } = await service.from('user_rate_versions').insert({
    org_id: orgId,
    user_id: userId,
    source_rate_version_id: matchedSourceRateVersionId,
    effective_from: effectiveFrom,
    currency: template.currency ?? 'MYR',
    mileage_rate_per_km: Number(template.mileage_rate_per_km ?? 0.6),
    meal_rate_default: Number(template.meal_rate_default ?? 0),
    meal_rate_per_session: Number(
      template.meal_rate_per_session ?? template.meal_rate_default ?? 0,
    ),
    meal_rate_full_day: Number(template.meal_rate_full_day ?? 0),
    meal_rate_morning: Number(template.meal_rate_morning ?? 0),
    meal_rate_noon: Number(template.meal_rate_noon ?? 0),
    meal_rate_evening: Number(template.meal_rate_evening ?? 0),
    lodging_rate_default: Number(template.lodging_rate_default ?? 0),
    perdiem_rate_myr: Number(template.perdiem_rate_myr ?? 0),
    rate_label: `Default from ${template.template_name ?? 'Template'}`,
    notes:
      matchedSourceRateVersionId
        ? 'Seeded automatically during user onboarding.'
        : `Seeded automatically during user onboarding from global template: ${template.template_name ?? 'Template'}.`,
    created_by_user_id: actorUserId,
  })

  if (error) {
    throw new Error(`Failed to seed default user rate: ${error.message}`)
  }

  return {
    seeded: true,
    reason: matchedSourceRateVersionId ? 'CREATED' as const : 'CREATED_FROM_GLOBAL_TEMPLATE' as const,
  }
}

async function writeAuditLog(params: {
  service: ReturnType<typeof createServiceRoleClient>
  orgId: string
  actorUserId: string
  entityId: string
  metadata: Record<string, unknown>
}) {
  const { service, orgId, actorUserId, entityId, metadata } = params

  const { error } = await service.from('audit_logs').insert({
    org_id: orgId,
    actor_user_id: actorUserId,
    entity_type: 'PROFILE',
    entity_id: entityId,
    action: 'USER_PROVISIONED',
    metadata,
  })

  if (error) {
    console.warn('[beta/provision-user] audit_logs insert failed:', error.message)
  }
}

export async function POST(request: NextRequest) {
  const actorResult = await resolveActor()
  if ('error' in actorResult) return actorResult.error

  const actor = actorResult.actor
  const service = createServiceRoleClient()

  const body = (await request.json().catch(() => ({}))) as {
    org_id?: string
    email?: string
    org_role?: string
    display_name?: string
    reset_if_exists?: boolean
    send_email?: boolean
    login_url?: string
    source_rate_version_id?: string
  }

  const orgId = String(body.org_id ?? '').trim()
  const email = normalizeEmail(body.email ?? '')
  const resetIfExists = body.reset_if_exists === true
  const sendEmail = body.send_email !== false
  const sourceRateVersionId = String(body.source_rate_version_id ?? '').trim()
  const loginUrl =
    body.login_url?.trim() ||
    process.env.USER_APP_LOGIN_URL?.trim() ||
    'http://localhost:3100/login'

  if (!orgId) {
    return err('VALIDATION_ERROR', 'org_id is required.', 400)
  }

  if (!email) {
    return err('VALIDATION_ERROR', 'email is required.', 400)
  }

  if (!isEmail(email)) {
    return err('VALIDATION_ERROR', 'A valid email is required.', 400)
  }

  if (!sourceRateVersionId) {
    return err('VALIDATION_ERROR', 'source_rate_version_id is required.', 400)
  }

  let orgRole: OrgRole
  try {
    orgRole = normalizeOrgRole(body.org_role)
  } catch (e) {
    return err('VALIDATION_ERROR', e instanceof Error ? e.message : 'Invalid org_role.', 400)
  }

  const displayName = body.display_name?.trim() || email

  try {
    const org = await resolveOrganisation(service, orgId)
    const tempPassword = makeTempPassword(email)

    const existingProfile = await findExistingProfileByEmail(service, email)

    let userId: string
    let mode: 'CREATED' | 'RESET' | 'ALREADY_EXISTS'

    if (existingProfile?.id) {
      userId = existingProfile.id

      if (resetIfExists) {
        const { error: resetError } = await service.auth.admin.updateUserById(userId, {
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
          },
          app_metadata: {
            must_change_password: true,
          },
        })

        if (resetError) {
          return err(
            'SERVER_ERROR',
            `Failed to reset existing user password: ${resetError.message}`,
            500,
          )
        }

        mode = 'RESET'
      } else {
        mode = 'ALREADY_EXISTS'
      }
    } else {
      const { data: created, error: createError } = await service.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
        },
        app_metadata: {
          must_change_password: true,
        },
      })

      if (createError || !created.user?.id) {
        return err(
          'SERVER_ERROR',
          `Failed to create auth user: ${createError?.message ?? 'Unknown error.'}`,
          500,
        )
      }

      userId = created.user.id
      mode = 'CREATED'
    }

    await upsertProfile({
      service,
      userId,
      email,
      displayName,
    })

    await upsertOrgMember({
      service,
      orgId: org.id,
      userId,
      orgRole,
    })

    const defaultRate = await ensureDefaultUserRate({
      service,
      orgId: org.id,
      userId,
      actorUserId: actor.id,
      sourceRateVersionId,
    })

    await ensureFreeSubscription(service, org.id)

    let emailDelivery: {
      attempted: boolean
      sent: boolean
      message?: string
      message_id?: string
    } = {
      attempted: false,
      sent: false,
    }

    if (sendEmail && !(mode === 'ALREADY_EXISTS' && !resetIfExists)) {
      emailDelivery.attempted = true

      try {
        const mail = await sendOnboardingEmail({
          to: email,
          orgName: org.name,
          tempPassword,
          loginUrl,
          displayName,
          defaultRateTemplateName: defaultRate.template_name ?? 'Default Template',
        })

        emailDelivery = {
          attempted: true,
          sent: true,
          message: 'Onboarding email sent successfully.',
          message_id: mail.messageId,
        }
      } catch (mailError) {
        const mailMessage =
          mailError instanceof Error ? mailError.message : 'Unknown mail error.'

        emailDelivery = {
          attempted: true,
          sent: false,
          message: mailMessage,
        }
      }
    }

    await writeAuditLog({
      service,
      orgId: org.id,
      actorUserId: actor.id,
      entityId: userId,
      metadata: {
        email,
        org_id: org.id,
        org_name: org.name,
        org_role: orgRole,
        result: mode,
        reset_if_exists: resetIfExists,
        source_rate_version_id: sourceRateVersionId,
        default_rate: defaultRate,
        email_delivery: emailDelivery,
      },
    })

    return NextResponse.json({
      success: true,
      mode,
      user: {
        id: userId,
        email,
        display_name: displayName,
      },
      org: {
        id: org.id,
        name: org.name,
        org_role: orgRole,
      },
      credentials:
        mode === 'ALREADY_EXISTS' && !resetIfExists
          ? {
              email,
              temp_password: null,
              note: 'User already existed. Membership was ensured, but no password reset was performed.',
            }
          : {
              email,
              temp_password: tempPassword,
              note: 'Share this temporary password securely. User should change it after first login.',
            },
      default_rate: defaultRate,
      email_delivery: emailDelivery,
    })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Unexpected error while provisioning user.'
    console.error('[beta/provision-user]', message)
    return err('SERVER_ERROR', message, 500)
  }
}
