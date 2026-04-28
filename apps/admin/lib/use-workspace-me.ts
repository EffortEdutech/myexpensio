'use client'
// apps/admin/lib/use-workspace-me.ts
//
// Hook that fetches /api/workspace/me and returns the auth context.
// Used by pages that need to detect internal staff and show an org picker.

import { useEffect, useState } from 'react'

export type WorkspaceMe = {
  userId:          string
  email:           string | null
  displayName:     string | null
  platformRole:    string
  isInternalStaff: boolean
  isSuperAdmin:    boolean
  orgId:           string | null
  orgName:         string | null
  orgRole:         string | null
  workspaceType:   string | null
  isTeamWorkspace: boolean
  isAgentWorkspace: boolean
}

type UseWorkspaceMeResult = {
  me:       WorkspaceMe | null
  loading:  boolean
  error:    boolean
}

export function useWorkspaceMe(): UseWorkspaceMeResult {
  const [me, setMe]         = useState<WorkspaceMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    fetch('/api/workspace/me')
      .then(async res => {
        if (!res.ok) throw new Error()
        const json = await res.json()
        setMe(json)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return { me, loading, error }
}
