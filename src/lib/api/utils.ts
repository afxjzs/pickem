// Utility functions for API operations and error handling

import { NextResponse } from "next/server"

export interface APIResponse<T = any> {
	success: boolean
	data?: T
	error?: string
	message?: string
	count?: number
	timestamp: string
	[key: string]: any
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
	data: T,
	additionalFields: Record<string, any> = {},
	options: { headers?: Record<string, string> } = {}
): NextResponse<APIResponse<T>> {
	const response: APIResponse<T> = {
		success: true,
		data,
		timestamp: new Date().toISOString(),
		...additionalFields,
	}

	return NextResponse.json(response, {
		headers: options.headers || {}
	})
}

/**
 * Create an error API response
 */
export function createErrorResponse(
	error: string,
	message?: string,
	status: number = 500,
	additionalFields: Record<string, any> = {}
): NextResponse<APIResponse> {
	const response: APIResponse = {
		success: false,
		error,
		message,
		timestamp: new Date().toISOString(),
		...additionalFields,
	}

	return NextResponse.json(response, { status })
}

/**
 * Handle API errors consistently
 */
export function handleAPIError(
	error: unknown,
	context: string,
	status: number = 500
): NextResponse<APIResponse> {
	console.error(`Error in ${context}:`, error)

	if (error instanceof Error) {
		return createErrorResponse(
			error.message,
			`Failed to ${context}`,
			status
		)
	}

	return createErrorResponse(
		`Failed to ${context}`,
		"Unknown error occurred",
		status
	)
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams<T extends Record<string, any>>(
	searchParams: URLSearchParams,
	schema: Record<
		keyof T,
		{
			type: "string" | "number" | "boolean"
			default?: any
			required?: boolean
		}
	>
): T {
	const params: Partial<T> = {}

	for (const [key, config] of Object.entries(schema)) {
		const value = searchParams.get(key)

		if (value === null) {
			if (config.required) {
				throw new Error(`Missing required parameter: ${key}`)
			}
			if (config.default !== undefined) {
				params[key as keyof T] = config.default
			}
			continue
		}

		try {
			switch (config.type) {
				case "string":
					params[key as keyof T] = value as T[keyof T]
					break
				case "number":
					const numValue = parseInt(value)
					if (isNaN(numValue)) {
						throw new Error(`Invalid number for parameter: ${key}`)
					}
					params[key as keyof T] = numValue as T[keyof T]
					break
				case "boolean":
					if (value === "true") {
						params[key as keyof T] = true as T[keyof T]
					} else if (value === "false") {
						params[key as keyof T] = false as T[keyof T]
					} else {
						throw new Error(`Invalid boolean for parameter: ${key}`)
					}
					break
			}
		} catch (parseError) {
			throw new Error(
				`Invalid value for parameter ${key}: ${
					parseError instanceof Error ? parseError.message : "Unknown error"
				}`
			)
		}
	}

	return params as T
}

/**
 * Validate team abbreviation
 */
export function isValidTeamAbbreviation(abbreviation: string): boolean {
	const validTeams = [
		// AFC
		"BUF",
		"MIA",
		"NE",
		"NYJ", // East
		"CIN",
		"BAL",
		"CLE",
		"PIT", // North
		"HOU",
		"IND",
		"JAX",
		"TEN", // South
		"DEN",
		"KC",
		"LV",
		"LAC", // West
		// NFC
		"DAL",
		"NYG",
		"PHI",
		"WAS", // East
		"CHI",
		"DET",
		"GB",
		"MIN", // North
		"ATL",
		"CAR",
		"NO",
		"TB", // South
		"ARI",
		"LAR",
		"SF",
		"SEA", // West
	]

	return validTeams.includes(abbreviation.toUpperCase())
}

/**
 * Validate conference
 */
export function isValidConference(conference: string): boolean {
	return ["AFC", "NFC"].includes(conference.toUpperCase())
}

/**
 * Validate division
 */
export function isValidDivision(division: string): boolean {
	return ["East", "North", "South", "West"].includes(division)
}

/**
 * Validate game status
 */
export function isValidGameStatus(status: string): boolean {
	return ["scheduled", "live", "final", "cancelled"].includes(
		status.toLowerCase()
	)
}

/**
 * Format date for display
 */
export function formatGameDate(dateString: string): string {
	const date = new Date(dateString)
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	})
}

/**
 * Get relative time for games
 */
export function getRelativeGameTime(dateString: string): string {
	const now = new Date()
	const gameTime = new Date(dateString)
	const diffMs = gameTime.getTime() - now.getTime()
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffMs < 0) {
		return "Game has started"
	} else if (diffDays > 0) {
		return `${diffDays} day${diffDays > 1 ? "s" : ""} away`
	} else if (diffHours > 0) {
		return `${diffHours} hour${diffHours > 1 ? "s" : ""} away`
	} else {
		const diffMinutes = Math.floor(diffMs / (1000 * 60))
		return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} away`
	}
}
