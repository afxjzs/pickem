/**
 * Get current time information in Eastern Time (ET)
 * Uses Intl.DateTimeFormat to properly handle timezone conversion
 * without string parsing issues
 */
export function getETTime(): {
	dayOfWeek: number // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
	hour: number // 0-23
	minute: number // 0-59
} {
	const now = new Date()
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		hour12: false,
	})

	const parts = formatter.formatToParts(now)
	const year = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10)
	const month = parseInt(parts.find((p) => p.type === "month")?.value || "0", 10)
	const day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10)
	const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10)
	const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10)

	// Create a Date object from the ET date components (treating them as UTC)
	// Then use getUTCDay() to get the day of week
	// Note: month is 1-indexed in Intl, but Date constructor expects 0-indexed
	const etDate = new Date(Date.UTC(year, month - 1, day, hour, minute))
	const dayOfWeek = etDate.getUTCDay()

	return {
		dayOfWeek,
		hour,
		minute,
	}
}

/**
 * Check if current ET time is past Tuesday noon ET
 * This is when NFL weeks flip to the next week
 */
export function isPastTuesdayNoonET(): boolean {
	const et = getETTime()
	// Tuesday = 2, Wednesday+ = 3, 4, 5, 6, 0
	return (et.dayOfWeek === 2 && et.hour >= 12) || et.dayOfWeek > 2
}

