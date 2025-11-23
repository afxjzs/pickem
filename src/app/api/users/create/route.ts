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

		// Parse request body for profile fields
		let body: { 
			email?: string
			display_name?: string
			first_name?: string
			last_name?: string
			username?: string
			avatar_url?: string
		} = {}
		try {
			body = await request.json()
		} catch {
			// Body is optional, use defaults from auth user
		}

		// Check if user already exists
		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('id', user.id)
			.maybeSingle()

		if (existingUser) {
			// User already exists, update fields if provided
			const updateData: { 
				email?: string
				display_name?: string
				first_name?: string
				last_name?: string
				username?: string
				avatar_url?: string
			} = {}
			
			if (body.email) updateData.email = body.email
			if (body.first_name) updateData.first_name = body.first_name
			if (body.last_name) updateData.last_name = body.last_name
			if (body.username) {
				// Check username uniqueness before updating
				const { data: usernameCheck } = await supabase
					.from('users')
					.select('id')
					.eq('username', body.username)
					.neq('id', user.id)
					.maybeSingle()
				
				if (usernameCheck) {
					return createErrorResponse("Bad Request", "Username is already taken", 400)
				}
				updateData.username = body.username
				// Set display_name to username for backward compatibility
				updateData.display_name = body.username
			}
			if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
			if (body.display_name && !body.username) updateData.display_name = body.display_name

			if (Object.keys(updateData).length > 0) {
				const { data: updatedUser, error: updateError } = await supabase
					.from('users')
					.update(updateData)
					.eq('id', user.id)
					.select()
					.single()

				if (updateError) {
					console.error("Failed to update user:", updateError)
					return createErrorResponse("Internal Server Error", updateError.message, 500)
				} else {
					return createSuccessResponse(updatedUser, {
						message: "User updated successfully"
					})
				}
			}

			return createSuccessResponse({ id: existingUser.id, created: false }, {
				message: "User already exists"
			})
		}

		// Validate required fields for new user creation
		if (!body.username) {
			return createErrorResponse("Bad Request", "Username is required", 400)
		}

		// Check username uniqueness
		const { data: usernameCheck } = await supabase
			.from('users')
			.select('id')
			.eq('username', body.username)
			.maybeSingle()

		if (usernameCheck) {
			return createErrorResponse("Bad Request", "Username is already taken", 400)
		}

		// Create user in users table
		const userEmail = body.email || user.email || ''
		const displayName = body.username // Use username as display_name for backward compatibility

		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert({
				id: user.id,
				email: userEmail,
				username: body.username,
				display_name: displayName,
				first_name: body.first_name,
				last_name: body.last_name,
				avatar_url: body.avatar_url,
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

