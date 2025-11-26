"use client"

import { useMemo } from "react"
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import type { WeeklyPerformanceUser } from "@/app/api/leaderboard/route"

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
)

interface CumulativePointsChartProps {
	data: WeeklyPerformanceUser[]
	currentUserId?: string
	currentWeek: number
	hideCard?: boolean
}

export default function CumulativePointsChart({
	data,
	currentUserId,
	currentWeek,
	hideCard = false,
}: CumulativePointsChartProps) {
	// Use all players, sorted by total points
	const sortedData = useMemo(() => {
		if (!data || data.length === 0) return []
		return [...data].sort((a, b) => b.total_points - a.total_points)
	}, [data])

	const chartData = useMemo(() => {
		if (!sortedData || sortedData.length === 0 || !currentWeek || currentWeek < 1) {
			return null
		}
		
		const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1)
		const labels = weeks.map(w => `Week ${w}`)
		
		// Expanded color palette for all players
		const colorPalette = [
			"#6b7280", "#9ca3af", "#d1d5db", "#f59e0b",
			"#10b981", "#8b5cf6", "#ec4899", "#14b8a6",
			"#ef4444", "#3b82f6", "#84cc16", "#f97316",
			"#06b6d4", "#a855f7", "#eab308", "#22c55e",
			"#f43f5e", "#6366f1", "#8b5cf6", "#ec4899"
		]
		
		const datasets = sortedData.map((user, index) => {
			const weekScores = user.week_scores as Record<string, number> | undefined
			const data: number[] = []
			
			let cumulative = 0
			for (let w = 1; w <= currentWeek; w++) {
				const score = weekScores?.[String(w)] ?? 0
				if (typeof score === 'number' && !isNaN(score)) {
					cumulative += score
				}
				data.push(cumulative)
			}
			
			const isCurrentUser = currentUserId && user.user_id === currentUserId
			const color = isCurrentUser ? "#2563eb" : colorPalette[index % colorPalette.length]
			
			return {
				label: user.display_name,
				data,
				borderColor: color,
				backgroundColor: color + "20",
				borderWidth: isCurrentUser ? 4 : 2,
				pointRadius: 3,
				pointHoverRadius: 6,
				tension: 0, // Straight lines with corners
				fill: false,
			}
		})
		
		return {
			labels,
			datasets,
		}
	}, [sortedData, currentWeek, currentUserId])

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			intersect: false,
			mode: 'index' as const,
		},
		plugins: {
			legend: {
				position: "right" as const,
				display: true,
				align: "start" as const,
				rtl: false,
				labels: {
					font: {
						size: 11,
					},
					boxWidth: 6,
					boxHeight: 6,
					padding: 5,
					usePointStyle: true,
					pointStyle: 'circle',
					generateLabels: (chart: any) => {
						const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart)
						return original.map((label: any) => {
							const dataset = chart.data.datasets[label.datasetIndex]
							const isCurrentUser = currentUserId && 
								sortedData[label.datasetIndex]?.user_id === currentUserId
							return {
								...label,
								font: {
									...label.font,
									weight: isCurrentUser ? "bold" : "normal",
								},
							}
						})
					},
				},
			},
			tooltip: {
				mode: "index" as const,
				intersect: false,
			},
		},
		scales: {
			x: {
				title: {
					display: true,
					text: "Week",
				},
				grid: {
					color: "#e5e7eb",
				},
			},
			y: {
				title: {
					display: true,
					text: "Points",
				},
				beginAtZero: true,
				grid: {
					color: "#e5e7eb",
				},
			},
		},
	}

	const cardClasses = hideCard
		? ""
		: "bg-white rounded-lg shadow p-4 md:p-6 border border-gray-200"

	if (!chartData || sortedData.length === 0) {
		return (
			<div className={cardClasses}>
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Cumulative Points Over Time
				</h3>
				<div className="text-center py-8 text-gray-500">No data available</div>
			</div>
		)
	}

	return (
		<div className={cardClasses}>
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				Cumulative Points Over Time
			</h3>
			<div style={{ height: "500px", width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: "20px" }}>
				<div style={{ width: "100%", height: "100%" }}>
					<Line data={chartData} options={{...options, plugins: {...options.plugins, legend: {...options.plugins.legend, display: false}}}} />
				</div>
				<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: "20px", minWidth: "160px" }}>
					{chartData.datasets.map((dataset, index) => {
						const isCurrentUser = currentUserId && sortedData[index]?.user_id === currentUserId
						return (
							<div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "6px", fontSize: "13px", lineHeight: "1.4" }}>
								<div style={{
									width: "6px",
									height: "6px",
									borderRadius: "50%",
									backgroundColor: dataset.borderColor as string,
									marginRight: "8px",
									flexShrink: 0
								}} />
								<span style={{ fontWeight: isCurrentUser ? "bold" : "normal", color: "#374151" }}>
									{dataset.label}
								</span>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
