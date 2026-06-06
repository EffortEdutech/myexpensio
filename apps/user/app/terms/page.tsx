import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  return (
    <main style={S.page}>
      <section style={S.card}>
        <Link href="/login" style={S.brand}>myexpensio</Link>
        <h1 style={S.title}>Terms of Service</h1>
        <p style={S.updated}>Last updated: 17 May 2026</p>

        <p style={S.p}>
          myexpensio is an invite-only expense, mileage, reimbursement, and personal finance assistant operated by
          EffortEdutech. By using myexpensio, you agree to use the platform responsibly and only for lawful business,
          reimbursement, subscription, or personal record-keeping purposes.
        </p>

        <h2 style={S.h2}>Your Account</h2>
        <p style={S.p}>
          You are responsible for keeping your login details secure and for ensuring the information you submit is
          accurate. Workspace owners and administrators are responsible for inviting the correct users and assigning
          appropriate workspace roles.
        </p>

        <h2 style={S.h2}>Claims, Reports, And Exports</h2>
        <p style={S.p}>
          Reports, export templates, tax summaries, route calculations, receipt scans, and TNG imports are provided to
          help with record keeping. You remain responsible for checking accuracy before submitting claims, tax documents,
          or reimbursement requests.
        </p>

        <h2 style={S.h2}>Subscriptions</h2>
        <p style={S.p}>
          Paid features may be offered through Free, Pro, and Premium plans. Plan access can change based on workspace or
          individual subscription status. Fees, renewals, cancellations, and refunds are handled according to the plan
          terms shown at checkout or billing settings.
        </p>

        <h2 style={S.h2}>Acceptable Use</h2>
        <p style={S.p}>
          Do not upload unlawful, misleading, malicious, or unrelated content. Do not attempt to bypass access controls,
          inspect another user&apos;s data without permission, or interfere with the platform&apos;s operation.
        </p>

        <h2 style={S.h2}>Changes</h2>
        <p style={S.p}>
          We may update these terms as myexpensio evolves. Continued use of the platform after updates means you accept
          the revised terms.
        </p>

        <h2 style={S.h2}>Contact</h2>
        <p style={S.p}>
          For support or questions, contact <a href="mailto:effort.myexpensio@gmail.com" style={S.link}>effort.myexpensio@gmail.com</a>.
        </p>
      </section>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f8fafc', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' },
  card: { maxWidth: 760, margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 28 },
  brand: { display: 'inline-block', marginBottom: 20, color: '#0f172a', fontWeight: 800, textDecoration: 'none' },
  title: { margin: 0, fontSize: 28, color: '#0f172a' },
  updated: { margin: '6px 0 24px', fontSize: 13, color: '#64748b' },
  h2: { margin: '24px 0 8px', fontSize: 16, color: '#0f172a' },
  p: { margin: '0 0 12px', fontSize: 14, lineHeight: 1.7, color: '#334155' },
  link: { color: '#2563eb' },
}
