"use client"

import { useState, useEffect } from "react"
import { Team } from "@/lib/types/database"

interface TeamsDisplayProps {
	initialConference?: "AFC" | "NFC"
	initialDivision?: "East" | "North" | "South" | "West"
}

export default function TeamsDisplay({
	initialConference,
	initialDivision,
}: TeamsDisplayProps) {
	const [teams, setTeams] = useState<Team[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [conference, setConference] = useState<"AFC" | "NFC" | "">(
		initialConference || ""
	)
	const [division, setDivision] = useState<
		"East" | "North" | "South" | "West" | ""
	>(initialDivision || "")
	const [activeOnly, setActiveOnly] = useState(true)

	useEffect(() => {
		fetchTeams()
	}, [conference, division, activeOnly])

	const fetchTeams = async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams()
			if (conference) params.append("conference", conference)
			if (division) params.append("division", division)
			if (activeOnly) params.append("active", "true")

			const response = await fetch(`/api/teams?${params.toString()}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Failed to fetch teams")
			}

			setTeams(data.data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}

	const getConferenceColor = (conf: string) => {
		return conf === "AFC" ? "text-blue-600" : "text-red-600"
	}

	const getDivisionColor = (div: string) => {
		const colors = {
			East: "text-green-600",
			North: "text-purple-600",
			South: "text-orange-600",
			West: "text-indigo-600",
		}
		return colors[div as keyof typeof colors] || "text-gray-600"
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Loading teams...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-md p-4">
				<div className="flex">
					<div className="flex-shrink-0">
						<svg
							className="h-5 w-5 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">
							Error loading teams
						</h3>
						<div className="mt-2 text-sm text-red-700">{error}</div>
						<button
							onClick={fetchTeams}
							className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="bg-white p-8 rounded-lg shadow-sm border">
				<div className="flex flex-wrap gap-8 items-center">
					<div className="mb-4 px-4">
						<label
							htmlFor="conference"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Conference
						</label>
						<select
							id="conference"
							value={conference}
							onChange={(e) =>
								setConference(e.target.value as "AFC" | "NFC" | "")
							}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900"
						>
							<option value="">All Conferences</option>
							<option value="AFC">AFC</option>
							<option value="NFC">NFC</option>
						</select>
					</div>

					<div className="mb-4 px-4">
						<label
							htmlFor="division"
							className="block text-sm font-medium text-gray-700 mb-3"
						>
							Division
						</label>
						<select
							id="division"
							value={division}
							onChange={(e) =>
								setDivision(
									e.target.value as "East" | "North" | "South" | "West" | ""
								)
							}
							className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900"
						>
							<option value="">All Divisions</option>
							<option value="East">East</option>
							<option value="North">North</option>
							<option value="South">South</option>
							<option value="West">West</option>
						</select>
					</div>

					<div className="flex items-center mb-4 px-4">
						<input
							id="active-only"
							type="checkbox"
							checked={activeOnly}
							onChange={(e) => setActiveOnly(e.target.checked)}
							className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label
							htmlFor="active-only"
							className="ml-2 block text-sm text-gray-900"
						>
							Active teams only
						</label>
					</div>

					<div className="ml-auto">
						<span className="text-sm text-gray-500">
							{teams.length} team{teams.length !== 1 ? "s" : ""}
						</span>
					</div>
				</div>
			</div>

			{/* Teams Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{teams.map((team) => (
					<div
						key={team.espn_id}
						className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
					>
						<div className="flex items-center space-x-3">
							{team.logo_url && (
								<img
									src={team.logo_url}
									alt={`${team.name} logo`}
									className="w-12 h-12 rounded-full object-cover"
								/>
							)}
							<div className="flex-1 min-w-0">
								<h3 className="text-sm font-medium text-gray-900 truncate">
									{team.display_name}
								</h3>
								<p className="text-xs text-gray-500 truncate">
									{team.location}
								</p>
								<div className="flex items-center space-x-2 mt-1">
									<span
										className={`text-xs font-medium ${getConferenceColor(
											team.conference
										)}`}
									>
										{team.conference}
									</span>
									<span
										className={`text-xs font-medium ${getDivisionColor(
											team.division
										)}`}
									>
										{team.division}
									</span>
								</div>
							</div>
						</div>

						{team.primary_color && (
							<div className="mt-3 flex space-x-1">
								<div
									className="w-4 h-4 rounded-full border border-gray-300"
									style={{ backgroundColor: `#${team.primary_color}` }}
									title="Primary color"
								/>
								{team.secondary_color && (
									<div
										className="w-4 h-4 rounded-full border border-gray-300"
										style={{ backgroundColor: `#${team.secondary_color}` }}
										title="Secondary color"
									/>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Empty State */}
			{teams.length === 0 && !loading && (
				<div className="text-center py-12">
					<svg
						className="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						No teams found
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Try adjusting your filters or check back later.
					</p>
				</div>
			)}
		</div>
	)
}
