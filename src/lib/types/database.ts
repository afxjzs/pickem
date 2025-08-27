export interface User {
	id: string
	email: string
	display_name?: string
	avatar_url?: string
	bio?: string
	is_admin: boolean
	created_at: string
	updated_at: string
}

export interface Game {
	id: string
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
	payment_type: 'entry_fee' | 'payout' | 'weekly' | 'season'
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
export type GameStatus = 'scheduled' | 'live' | 'final' | 'cancelled'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type PaymentType = 'entry_fee' | 'payout' | 'weekly' | 'season'

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
	rank: number
}
