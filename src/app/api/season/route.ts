import { NextRequest } from "next/server"
import { espnAPI } from "@/lib/api/espn"
import { createSuccessResponse, handleAPIError } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		// Get current season info from ESPN API
		const seasonInfo = await espnAPI.getCurrentSeasonInfo()

		return createSuccessResponse(seasonInfo)
	} catch (error) {
		return handleAPIError(error, "fetch season info")
	}
}
