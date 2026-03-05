export default function OrgInvitesPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Invitations</h1>
      <p style={{ opacity: 0.8 }}>Placeholder invite list/create for Org ID: {params.id}</p>
    </div>
  )
}