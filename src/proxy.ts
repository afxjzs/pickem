import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request: Request) {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	})

	// Create cookie handlers that work with Request/Response
	const cookies = {
		getAll() {
			// Extract cookies from Request Cookie header
			const cookieHeader = request.headers.get('cookie') || ''
			if (!cookieHeader) return []
			
			return cookieHeader.split(';').map(cookie => {
				const trimmed = cookie.trim()
				const [name, ...valueParts] = trimmed.split('=')
				return { 
					name: name.trim(), 
					value: decodeURIComponent(valueParts.join('=') || '') 
				}
			}).filter(cookie => cookie.name && cookie.value)
		},
		setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
			// Update response with new cookies
			cookiesToSet.forEach(({ name, value, options }) => {
				response.cookies.set({
					name,
					value,
					...options,
				})
			})
		},
	}

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies,
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
	const url = new URL(request.url)
	if (url.pathname.startsWith('/api/')) {
		console.log(`[Proxy] API route ${url.pathname}, user: ${user ? user.id : 'none'}, error: ${error?.message || 'none'}`)
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

