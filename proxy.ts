import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/api/webhooks')
  
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Check if user is trying to access MFA pages
    const isMfaRoute = request.nextUrl.pathname.startsWith('/mfa')

    // 2. MFA check
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    
    if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
      // User has enrolled in MFA but hasn't verified this session
      if (!isMfaRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/mfa/verify'
        return NextResponse.redirect(url)
      }
    } else if (mfaData && mfaData.nextLevel === 'aal1') {
      // User hasn't enrolled in MFA
      if (!isMfaRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/mfa/setup'
        return NextResponse.redirect(url)
      }
    } else if (mfaData && mfaData.currentLevel === 'aal2' && isMfaRoute) {
      // User is fully authenticated and on an MFA route, redirect to inbox
      const url = request.nextUrl.clone()
      url.pathname = '/inbox'
      return NextResponse.redirect(url)
    }

    // 3 & 4. Admin and Active check
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    
    // Fetch profile to check role and is_active
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile && !profile.is_active) {
      if (request.nextUrl.pathname !== '/suspended') {
        const url = request.nextUrl.clone()
        url.pathname = '/suspended'
        return NextResponse.redirect(url)
      }
    } else if (request.nextUrl.pathname === '/suspended') {
      // If active user tries to visit suspended page
      const url = request.nextUrl.clone()
      url.pathname = '/inbox'
      return NextResponse.redirect(url)
    }

    if (isAdminRoute && profile?.role !== 'admin') {
      // Non-admin trying to access admin route
      const url = request.nextUrl.clone()
      url.pathname = '/inbox'
      return NextResponse.redirect(url)
    }
    
    // Redirect authenticated fully-verified users away from login
    if (isPublicRoute && !request.nextUrl.pathname.startsWith('/api/webhooks')) {
      const url = request.nextUrl.clone()
      url.pathname = '/inbox'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
