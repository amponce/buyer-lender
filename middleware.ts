import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // If user is already logged in and trying to access auth pages, redirect to appropriate dashboard
    if (['/login', '/register'].includes(path) && token) {
      if (token.role === 'BUYER') {
        return NextResponse.redirect(new URL('/buyer-dashboard', req.url))
      }
      if (token.role === 'LENDER') {
        return NextResponse.redirect(new URL('/lender-dashboard', req.url))
      }
    }

    // Protected paths - role-based access control
    if (path.startsWith('/buyer-dashboard') && token?.role !== 'BUYER') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (path.startsWith('/lender-dashboard') && token?.role !== 'LENDER') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Allow access to login and register pages without auth
        if (['/login', '/register', '/'].includes(path)) {
          return true
        }
        // Require auth for all other pages
        return !!token
      }
    }
  }
)

// Specify which paths should be handled by middleware
export const config = {
  matcher: [
    '/buyer-dashboard/:path*',
    '/lender-dashboard/:path*',
    '/login',
    '/register'
  ]
} 