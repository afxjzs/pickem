import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
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
					cookiesToSet.forEach(({ name, value, options }) => {
						request.cookies.set({
							name,
							value,
							...options,
						})
						response = NextResponse.next({
							request: {
								headers: request.headers,
							},
						})
						response.cookies.set({
							name,
							value,
							...options,
						})
					})
				},
			},
			db: {
				schema: 'pickem'
			}
		}
	)

	// IMPORTANT: Call getUser() to refresh the session if expired
	// This must be awaited to ensure the session is refreshed before the request continues
	// The response will contain updated cookies if the session was refreshed
	const { data: { user }, error } = await supabase.auth.getUser()
	
	// Log for debugging
	if (request.nextUrl.pathname.startsWith('/api/')) {
		console.log(`[Middleware] API route ${request.nextUrl.pathname}, user: ${user ? user.id : 'none'}, error: ${error?.message || 'none'}`)
	}

	return response
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}

