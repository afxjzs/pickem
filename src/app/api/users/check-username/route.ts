// Check if username is available
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()

		// Auth check - user must be authenticated
		// Try to get the session first to see if we can refresh it
		const { data: { session }, error: sessionError } = await supabase.auth.getSession()
		const { data: authData, error: authError } = await supabase.auth.getUser()
		
		// Log for debugging in production
		if (!authData?.user) {
			console.error(`[check-username] Auth failed:`, {
				hasUser: !!authData?.user,
				hasSession: !!session,
				authError: authError?.message,
				sessionError: sessionError?.message,
				path: request.nextUrl.pathname,
				cookies: request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`),
			})
			return createErrorResponse("Unauthorized", "User must be authenticated", 401)
		}

		// Get username from query params
		const searchParams = request.nextUrl.searchParams
		const username = searchParams.get("username")

		if (!username || username.trim().length === 0) {
			return createErrorResponse("Bad Request", "Username is required", 400)
		}

		// Check if username is already taken (excluding current user)
		// The client is configured with db: { schema: 'pickem' } so this should query the pickem schema
		const { data: existingUser, error: checkError } = await supabase
			.from('users')
			.select('id, username')
			.eq('username', username.trim())
			.neq('id', authData.user.id)
			.maybeSingle()

		if (checkError) {
			console.error("Error checking username:", checkError)
			return createErrorResponse("Internal Server Error", checkError.message, 500)
		}

		return createSuccessResponse({ available: !existingUser })
	} catch (error) {
		console.error("Error in /api/users/check-username:", error)
		return createErrorResponse(
			"Internal Server Error",
			error instanceof Error ? error.message : "Unknown error",
			500
		)
	}
}




