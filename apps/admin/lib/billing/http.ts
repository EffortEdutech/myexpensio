import { NextResponse } from 'next/server'

export function err(code: string, message: string, status: number) {
  return NextResponse.json(
    { ok: false, data: null, error: { code, message } },
    { status }
  )
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(
    { ok: true, data, error: null },
    { status }
  )
}

export function parsePaging(url: URL) {
  const pageParam =
    url.searchParams.get('page') ??
    '1'

  const pageSizeParam =
    url.searchParams.get('page_size') ??
    url.searchParams.get('pageSize') ??
    '20'

  const page = Number.isFinite(Number(pageParam))
    ? Math.max(1, Number(pageParam))
    : 1

  const pageSizeRaw = Number.isFinite(Number(pageSizeParam))
    ? Number(pageSizeParam)
    : 20

  const pageSize = Math.min(100, Math.max(1, pageSizeRaw))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { page, pageSize, from, to }
}