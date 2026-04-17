import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status }
  )
}

export function parsePaging(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size') ?? 20)))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, from, to }
}
