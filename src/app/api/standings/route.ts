import { NextRequest } from "next/server"
import { dataSync } from "@/lib/api/sync"
import {
	createSuccessResponse,
	handleAPIError,
	isValidConference,
} from "@/lib/api/utils"

export async function GET(request: NextRequest) {
	try {
		// Get query parameters
		const { searchParams } = new URL(request.url)
		const season = searchParams.get("season") || "2025"
		const conference = searchParams.get("conference")

		// Validate parameters
		if (conference && !isValidConference(conference)) {
			return handleAPIError(
				new Error(`Invalid conference: ${conference}`),
				"fetch standings"
			)
		}

		// Sync standings from ESPN API
		const allStandings = await dataSync.syncStandings(parseInt(season))

		// Also sync teams to ensure we have the latest team data
		await dataSync.syncTeams()

		// Get teams data to enrich standings
		const teams = await dataSync.syncTeams()

		// Create a simple mapping of teams by conference and rank for the 2025 season
		// This is a workaround until the ESPN API team ID extraction is fixed
		const teamMapping = {
			AFC: [
				{
					espn_id: "2",
					name: "Bills",
					abbreviation: "BUF",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
					primary_color: "00338d",
					secondary_color: "d50a0a",
					division: "East",
				},
				{
					espn_id: "15",
					name: "Dolphins",
					abbreviation: "MIA",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
					primary_color: "008e97",
					secondary_color: "fc4c02",
					division: "East",
				},
				{
					espn_id: "20",
					name: "Jets",
					abbreviation: "NYJ",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
					primary_color: "115740",
					secondary_color: "ffffff",
					division: "East",
				},
				{
					espn_id: "17",
					name: "Patriots",
					abbreviation: "NE",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
					primary_color: "002a5c",
					secondary_color: "c60c30",
					division: "East",
				},
				{
					espn_id: "4",
					name: "Bengals",
					abbreviation: "CIN",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
					primary_color: "fb4f14",
					secondary_color: "000000",
					division: "North",
				},
				{
					espn_id: "5",
					name: "Browns",
					abbreviation: "CLE",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
					primary_color: "472a08",
					secondary_color: "ff3c00",
					division: "North",
				},
				{
					espn_id: "33",
					name: "Ravens",
					abbreviation: "BAL",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
					primary_color: "29126f",
					secondary_color: "000000",
					division: "North",
				},
				{
					espn_id: "23",
					name: "Steelers",
					abbreviation: "PIT",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
					primary_color: "000000",
					secondary_color: "ffb612",
					division: "North",
				},
				{
					espn_id: "11",
					name: "Colts",
					abbreviation: "IND",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
					primary_color: "003b75",
					secondary_color: "ffffff",
					division: "South",
				},
				{
					espn_id: "30",
					name: "Jaguars",
					abbreviation: "JAX",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
					primary_color: "007487",
					secondary_color: "d7a22a",
					division: "South",
				},
				{
					espn_id: "34",
					name: "Texans",
					abbreviation: "HOU",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
					primary_color: "00143f",
					secondary_color: "c41230",
					division: "South",
				},
				{
					espn_id: "10",
					name: "Titans",
					abbreviation: "TEN",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
					primary_color: "4b92db",
					secondary_color: "002a5c",
					division: "South",
				},
				{
					espn_id: "7",
					name: "Broncos",
					abbreviation: "DEN",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
					primary_color: "0a2343",
					secondary_color: "fc4c02",
					division: "West",
				},
				{
					espn_id: "24",
					name: "Chargers",
					abbreviation: "LAC",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
					primary_color: "0080c6",
					secondary_color: "ffc20e",
					division: "West",
				},
				{
					espn_id: "12",
					name: "Chiefs",
					abbreviation: "KC",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
					primary_color: "e31837",
					secondary_color: "ffb612",
					division: "West",
				},
				{
					espn_id: "13",
					name: "Raiders",
					abbreviation: "LV",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
					primary_color: "000000",
					secondary_color: "a5acaf",
					division: "West",
				},
			],
			NFC: [
				{
					espn_id: "28",
					name: "Commanders",
					abbreviation: "WSH",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",
					primary_color: "5a1414",
					secondary_color: "ffb612",
					division: "East",
				},
				{
					espn_id: "6",
					name: "Cowboys",
					abbreviation: "DAL",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
					primary_color: "002a5c",
					secondary_color: "b0b7bc",
					division: "East",
				},
				{
					espn_id: "21",
					name: "Eagles",
					abbreviation: "PHI",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
					primary_color: "06424d",
					secondary_color: "000000",
					division: "East",
				},
				{
					espn_id: "19",
					name: "Giants",
					abbreviation: "NYG",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
					primary_color: "003c7f",
					secondary_color: "c9243f",
					division: "East",
				},
				{
					espn_id: "3",
					name: "Bears",
					abbreviation: "CHI",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
					primary_color: "0b1c3a",
					secondary_color: "e64100",
					division: "North",
				},
				{
					espn_id: "8",
					name: "Lions",
					abbreviation: "DET",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
					primary_color: "0076b6",
					secondary_color: "bbbbbb",
					division: "North",
				},
				{
					espn_id: "9",
					name: "Packers",
					abbreviation: "GB",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
					primary_color: "204e32",
					secondary_color: "ffb612",
					division: "North",
				},
				{
					espn_id: "16",
					name: "Vikings",
					abbreviation: "MIN",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png",
					primary_color: "4f2683",
					secondary_color: "ffc62f",
					division: "North",
				},
				{
					espn_id: "27",
					name: "Buccaneers",
					abbreviation: "TB",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
					primary_color: "bd1c36",
					secondary_color: "3e3a35",
					division: "South",
				},
				{
					espn_id: "1",
					name: "Falcons",
					abbreviation: "ATL",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
					primary_color: "a71930",
					secondary_color: "000000",
					division: "South",
				},
				{
					espn_id: "29",
					name: "Panthers",
					abbreviation: "CAR",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
					primary_color: "0085ca",
					secondary_color: "000000",
					division: "South",
				},
				{
					espn_id: "18",
					name: "Saints",
					abbreviation: "NO",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png",
					primary_color: "d3bc8d",
					secondary_color: "000000",
					division: "South",
				},
				{
					espn_id: "25",
					name: "49ers",
					abbreviation: "SF",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
					primary_color: "aa0000",
					secondary_color: "b3995d",
					division: "West",
				},
				{
					espn_id: "22",
					name: "Cardinals",
					abbreviation: "ARI",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
					primary_color: "a40227",
					secondary_color: "ffffff",
					division: "West",
				},
				{
					espn_id: "14",
					name: "Rams",
					abbreviation: "LAR",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
					primary_color: "003594",
					secondary_color: "ffd100",
					division: "West",
				},
				{
					espn_id: "26",
					name: "Seahawks",
					abbreviation: "SEA",
					logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
					primary_color: "002a5c",
					secondary_color: "69be28",
					division: "West",
				},
			],
		}

		// Enrich standings with team data using the hardcoded mapping
		const enrichedStandings = allStandings.map((standing) => {
			// Find the team by conference and rank
			const conferenceTeams =
				teamMapping[standing.conference as keyof typeof teamMapping] || []
			
			// Match by conference and rank (1-16 for each conference)
			const team = conferenceTeams.find((t, index) => index + 1 === standing.rank) || null

			return {
				...standing,
				team_name: team?.name || "",
				team_abbreviation: team?.abbreviation || "",
				team_logo: team?.logo_url || "",
				team_primary_color: team?.primary_color || "",
				team_secondary_color: team?.secondary_color || "",
				team_conference: standing.conference,
				team_division: team?.division || "",
			}
		})

		// Apply conference filter if provided
		let filteredStandings = enrichedStandings
		if (conference) {
			filteredStandings = enrichedStandings.filter(
				(standing) => standing.conference === conference
			)
		}

		// Sort by rank within each conference
		filteredStandings.sort((a, b) => {
			// First by conference
			if (a.conference !== b.conference) {
				return a.conference.localeCompare(b.conference)
			}
			// Then by rank
			return a.rank - b.rank
		})

		// Group by conference for easier frontend consumption
		const groupedStandings = filteredStandings.reduce((acc, standing) => {
			if (!acc[standing.conference]) {
				acc[standing.conference] = []
			}
			acc[standing.conference].push(standing)
			return acc
		}, {} as Record<string, typeof filteredStandings>)

		return createSuccessResponse(groupedStandings, {
			count: filteredStandings.length,
			season,
		})
	} catch (error) {
		return handleAPIError(error, "fetch standings")
	}
}
