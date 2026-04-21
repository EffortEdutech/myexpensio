type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OrgInvitesPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Invitations</h1>
      <p style={{ opacity: 0.8 }}>
        Placeholder invite list/create for Org ID: {id}
      </p>
    </div>
  )
}