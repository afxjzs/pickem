import { NextRequest } from "next/server"
import { dataSync } from "@/lib/api/sync"
import { createSuccessResponse, handleAPIError, isValidConference, isValidDivision } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		// Get query parameters
		const { searchParams } = new URL(request.url)
		const conference = searchParams.get("conference")
		const division = searchParams.get("division")
		const active = searchParams.get("active")

		// Validate parameters
		if (conference && !isValidConference(conference)) {
			return handleAPIError(new Error(`Invalid conference: ${conference}`), "fetch teams")
		}

		if (division && !isValidDivision(division)) {
			return handleAPIError(new Error(`Invalid division: ${division}`), "fetch teams")
		}

		// Sync teams from ESPN API
		const teams = await dataSync.syncTeams()

		// Apply filters if provided
		let filteredTeams = teams

		if (conference) {
			filteredTeams = filteredTeams.filter(team => team.conference === conference)
		}

		if (division) {
			filteredTeams = filteredTeams.filter(team => team.division === division)
		}

		if (active !== null) {
			const isActive = active === "true"
			filteredTeams = filteredTeams.filter(team => team.active === isActive)
		}

		// Sort by conference, division, and name
		filteredTeams.sort((a, b) => {
			// First by conference
			if (a.conference !== b.conference) {
				return a.conference.localeCompare(b.conference)
			}
			// Then by division
			if (a.division !== b.division) {
				return a.division.localeCompare(b.division)
			}
			// Finally by name
			return a.name.localeCompare(b.name)
		})

		return createSuccessResponse(filteredTeams, {
			count: filteredTeams.length
		})

	} catch (error) {
		return handleAPIError(error, "fetch teams")
	}
}
