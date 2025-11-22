// Test endpoint to debug authentication
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies()
		const allCookies = cookieStore.getAll()
		
		const supabase = await createClient()
		
		// Try to get session first
		const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
		
		// Then try to get user
		const { data: authData, error: authError } = await supabase.auth.getUser()
		
		// Check if user exists in database
		let userInDb = null
		if (authData?.user?.id) {
			const { data: dbUser, error: dbError } = await supabase
				.from('users')
				.select('id, email, display_name')
				.eq('id', authData.user.id)
				.maybeSingle() // Use maybeSingle() instead of single() - returns null if no row, doesn't error
			
			if (dbError) {
				userInDb = { exists: false, error: dbError.message, code: dbError.code }
			} else if (dbUser) {
				userInDb = { exists: true, email: dbUser.email, displayName: dbUser.display_name }
			} else {
				userInDb = { exists: false, error: "User not found in users table (but authenticated)" }
			}
		}
		
		return Response.json({
			success: true,
			cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
			session: {
				hasSession: !!sessionData?.session,
				accessToken: sessionData?.session?.access_token ? 'present' : 'missing',
				refreshToken: sessionData?.session?.refresh_token ? 'present' : 'missing',
				error: sessionError?.message || null,
			},
			auth: {
				hasUser: !!authData?.user,
				userId: authData?.user?.id || null,
				userEmail: authData?.user?.email || null,
				error: authError?.message || null,
				errorCode: authError?.status || null,
			},
			database: userInDb,
			supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
		})
	} catch (error) {
		return Response.json({
			success: false,
			error: error instanceof Error ? error.message : String(error),
		}, { status: 500 })
	}
}
