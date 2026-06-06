import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <main style={S.page}>
      <section style={S.card}>
        <Link href="/login" style={S.brand}>myexpensio</Link>
        <h1 style={S.title}>Privacy Policy</h1>
        <p style={S.updated}>Last updated: 17 May 2026</p>

        <p style={S.p}>
          This policy explains how myexpensio handles personal data in line with the Malaysian Personal Data Protection
          Act 2010 (PDPA). We collect and process data only to provide reimbursement, expense tracking, workspace
          administration, billing, and related support services.
        </p>

        <h2 style={S.h2}>Data We Process</h2>
        <p style={S.p}>
          We may process your name, email address, workspace membership, role, claim details, trip and mileage records,
          receipts, TNG statement data, subscription status, billing references, consent records, and audit logs.
        </p>

        <h2 style={S.h2}>Why We Use It</h2>
        <p style={S.p}>
          We use your data to authenticate your account, manage workspaces, prepare claims and reports, calculate route
          and expense information, process invitations, maintain audit trails, support billing, and protect the platform.
        </p>

        <h2 style={S.h2}>Sharing</h2>
        <p style={S.p}>
          We do not sell your personal data. Data may be visible to your workspace owner, administrators, managers, or
          internal support staff where needed to operate the service. We may also use trusted service providers for
          hosting, authentication, email delivery, payment processing, and storage.
        </p>

        <h2 style={S.h2}>Retention And Security</h2>
        <p style={S.p}>
          We retain records as needed for platform operation, audit, billing, legal, or tax-related purposes. We apply
          access controls and operational safeguards, but you should also protect your login credentials and devices.
        </p>

        <h2 style={S.h2}>Your Choices</h2>
        <p style={S.p}>
          You may request access, correction, or support regarding your personal data by contacting us. Some records may
          need to be retained where required for audit, legal, accounting, or security reasons.
        </p>

        <h2 style={S.h2}>Contact</h2>
        <p style={S.p}>
          For privacy questions or PDPA requests, contact <a href="mailto:effort.myexpensio@gmail.com" style={S.link}>effort.myexpensio@gmail.com</a>.
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
