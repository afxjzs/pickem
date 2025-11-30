// Get current user profile
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()

		// Auth check - user must be authenticated
		const { data: authData, error: authError } = await supabase.auth.getUser()
		if (!authData?.user) {
			return createErrorResponse("Unauthorized", "User must be authenticated", 401)
		}

		const user = authData.user

		// Get user from users table
		const { data: dbUser, error: dbError } = await supabase
			.from('users')
			.select('*')
			.eq('id', user.id)
			.maybeSingle()

		if (dbError) {
			console.error("[API /users/me] Error fetching user:", {
				error: dbError,
				message: dbError.message,
				code: dbError.code,
				details: dbError.details,
				userId: user.id,
				userEmail: user.email
			})
			return createErrorResponse("Internal Server Error", dbError.message, 500)
		}

		if (!dbUser) {
			console.log("[API /users/me] User not found in pickem.users table:", {
				userId: user.id,
				userEmail: user.email
			})
			return createErrorResponse("Not Found", "User profile not found", 404)
		}

		console.log("[API /users/me] User found:", {
			userId: dbUser.id,
			username: dbUser.username,
			email: dbUser.email
		})

		return createSuccessResponse(dbUser)
	} catch (error) {
		console.error("Error in /api/users/me:", error)
		return createErrorResponse(
			"Internal Server Error",
			error instanceof Error ? error.message : "Unknown error",
			500
		)
	}
}




