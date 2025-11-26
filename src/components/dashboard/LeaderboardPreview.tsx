"use client"

import Link from "next/link"
import type { SeasonStanding } from "@/lib/types/database"

interface LeaderboardPreviewProps {
	standings: SeasonStanding[]
	currentUserId?: string
}

export default function LeaderboardPreview({
	standings,
	currentUserId,
}: LeaderboardPreviewProps) {
	// Get top 5 players
	const topPlayers = standings.slice(0, 5)
	const currentUserStanding = standings.find(
		(s) => s.user_id === currentUserId
	)

	return (
		<div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-900">Top Players</h3>
				<Link
					href="/leaderboard/standings"
					className="text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					View All →
				</Link>
			</div>
			<div className="space-y-2">
				{topPlayers.map((player, index) => {
					const isCurrentUser = player.user_id === currentUserId
					return (
						<div
							key={player.user_id}
							className={`flex items-center justify-between p-2 rounded ${
								isCurrentUser ? "bg-yellow-50" : "bg-gray-50"
							}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
										index === 0
											? "bg-yellow-400 text-yellow-900"
											: index === 1
											? "bg-gray-300 text-gray-700"
											: index === 2
											? "bg-orange-300 text-orange-900"
											: "bg-gray-200 text-gray-600"
									}`}
								>
									{index + 1}
								</div>
								<div>
									<div className="text-sm font-medium text-gray-900">
										{player.display_name}
										{isCurrentUser && (
											<span className="ml-2 text-xs text-blue-600">(You)</span>
										)}
									</div>
								</div>
							</div>
							<div className="text-sm font-semibold text-gray-700">
								{player.total_points} pts
							</div>
						</div>
					)
				})}
			</div>
			{currentUserStanding && currentUserStanding.rank > 5 && (
				<div className="mt-4 pt-4 border-t border-gray-200">
					<div className="flex items-center justify-between p-2 rounded bg-blue-50">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-blue-200 text-blue-900">
								{currentUserStanding.rank}
							</div>
							<div className="text-sm font-medium text-gray-900">
								{currentUserStanding.display_name}
								<span className="ml-2 text-xs text-blue-600">(You)</span>
							</div>
						</div>
						<div className="text-sm font-semibold text-gray-700">
							{currentUserStanding.total_points} pts
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

