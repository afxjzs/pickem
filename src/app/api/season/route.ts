import { NextRequest } from "next/server"
import { getCurrentWeekFromDatabase } from "@/lib/utils/database"
import { createSuccessResponse, handleAPIError } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const season = searchParams.get("season") || "2025"

		// Get current week from database instead of ESPN API
		const seasonInfo = await getCurrentWeekFromDatabase(season)

		return createSuccessResponse(seasonInfo)
	} catch (error) {
		return handleAPIError(error, "fetch season info")
	}
}
