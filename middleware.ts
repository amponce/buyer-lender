import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control
  if (request.nextUrl.pathname.startsWith('/buyer-dashboard') && token.role !== 'BUYER') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/lender-dashboard') && token.role !== 'LENDER') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/buyer-dashboard/:path*', '/lender-dashboard/:path*', '/quote-request/:path*']
} 