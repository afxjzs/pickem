// Create user in users table after Supabase Auth signup
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/api/utils"

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient()

		// Auth check - user must be authenticated
		const { data: authData, error: authError } = await supabase.auth.getUser()
		if (!authData?.user) {
			return createErrorResponse("Unauthorized", "User must be authenticated", 401)
		}

		const user = authData.user

		// Check if user already exists
		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('id', user.id)
			.maybeSingle()

		if (existingUser) {
			// User already exists, return success
			return createSuccessResponse({ id: existingUser.id, created: false }, {
				message: "User already exists"
			})
		}

		// Create user in users table
		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert({
				id: user.id,
				email: user.email || '',
				display_name: user.email?.split('@')[0] || 'User',
			})
			.select()
			.single()

		if (createError) {
			console.error("Failed to create user in users table:", createError)
			return createErrorResponse("Internal Server Error", createError.message, 500)
		}

		return createSuccessResponse(newUser, {
			message: "User created successfully"
		})
	} catch (error) {
		console.error("Error in /api/users/create:", error)
		return createErrorResponse(
			"Internal Server Error",
			error instanceof Error ? error.message : "Unknown error",
			500
		)
	}
}

