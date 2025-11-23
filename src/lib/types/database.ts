export interface User {
	id: string
	email: string
	first_name?: string
	last_name?: string
	username?: string
	display_name?: string
	avatar_url?: string
	bio?: string
	is_admin: boolean
	created_at: string
	updated_at: string
}

export interface Team {
	id: string
	espn_id: string
	name: string
	abbreviation: string
	display_name: string
	short_display_name: string
	location: string
	primary_color: string
	secondary_color: string
	logo_url?: string
	conference: "AFC" | "NFC"
	division: "East" | "North" | "South" | "West"
	active: boolean
	created_at: string
	updated_at: string
}

export interface Game {
	id: string
	espn_id?: string
	sport: string
	season: string
	week: number
	home_team: string
	away_team: string
	start_time: string
	status: string
	home_score?: number
	away_score?: number
	is_snf: boolean
	is_mnf: boolean
	spread?: number
	over_under?: number
	created_at: string
	updated_at: string
}

export interface EnrichedGame extends Game {
	home_team_data: Team | null
	away_team_data: Team | null
}

export interface Standing {
	id: string
	team_id: string
	season: string
	conference: "AFC" | "NFC"
	wins: number
	losses: number
	ties: number
	win_percentage: number
	points_for: number
	points_against: number
	rank: number
	created_at: string
	updated_at: string
}

export interface Pick {
	id: string
	user_id: string
	game_id: string
	picked_team: string
	confidence_points: number
	created_at: string
	updated_at: string
}

export interface Score {
	id: string
	user_id: string
	week: number
	season: string
	points: number
	correct_picks: number
	total_picks: number
	created_at: string
	updated_at: string
}

export interface Payment {
	id: string
	user_id: string
	stripe_payment_id: string
	amount_cents: number
	currency: string
	status: string
	payment_type: "entry_fee" | "payout" | "weekly" | "season"
	week?: number
	season?: string
	created_at: string
	updated_at: string
}

export interface AppConfig {
	id: string
	key: string
	value: string
	description?: string
	created_at: string
	updated_at: string
}

// Database enums
export type GameStatus = "scheduled" | "live" | "final" | "cancelled"
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"
export type PaymentType = "entry_fee" | "payout" | "weekly" | "season"

// Extended types for API responses
export interface GameWithPicks extends Game {
	picks?: Pick[]
}

export interface UserWithScores extends User {
	scores?: Score[]
}

export interface WeekStanding {
	user_id: string
	display_name: string
	points: number
	correct_picks: number
	total_picks: number
	rank: number
}

export interface SeasonStanding {
	user_id: string
	display_name: string
	total_points: number
	weeks_played: number
	average_points: number
	total_picks: number
	correct_picks: number
	correct_picks_percentage: number
	rank: number
}
