'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Interface Segregation Principle: Define specific interfaces for different concerns
interface AuthState {
	user: User | null
	loading: boolean
}

interface AuthActions {
	signIn: (email: string, password: string) => Promise<{ error: string | null }>
	signUp: (email: string, password: string) => Promise<{ error: string | null }>
	signOut: () => Promise<{ error: string | null }>
}

// Single Responsibility Principle: AuthContext only handles authentication state
interface AuthContextType extends AuthState, AuthActions {}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Dependency Inversion Principle: AuthProvider depends on abstractions, not concrete implementations
interface AuthProviderProps {
	children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const supabase = createClient()

	useEffect(() => {
		// Get initial user session
		const getUser = async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser()
				setUser(user)
				
				// Ensure user exists in users table (for users created via Studio or other means)
				if (user) {
					try {
						await fetch('/api/users/create', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							credentials: 'include',
						})
					} catch (error) {
						console.error('Error ensuring user exists in users table:', error)
						// Non-critical - user can still use the app
					}
				}
			} catch {
				console.error('Error getting user')
			} finally {
				setLoading(false)
			}
		}

		getUser()

		// Listen for auth state changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				setUser(session?.user ?? null)
				setLoading(false)
				
				// If user just signed up or signed in, ensure they exist in users table
				if ((event === 'SIGNED_IN' || event === 'SIGNED_UP') && session?.user) {
					try {
						await fetch('/api/users/create', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							credentials: 'include',
						})
					} catch (error) {
						console.error('Error ensuring user exists in users table:', error)
						// Non-critical - user can still use the app
					}
				}
			}
		)

		return () => subscription.unsubscribe()
	}, [supabase.auth])

	// Open/Closed Principle: Easy to extend with new auth methods without modifying existing code
	const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
		try {
			const { error } = await supabase.auth.signInWithPassword({ email, password })
			return { error: error?.message || null }
		} catch {
			return { error: 'An unexpected error occurred' }
		}
	}

	const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
		try {
			const { data, error } = await supabase.auth.signUp({ email, password })
			if (error) {
				return { error: error.message }
			}

			// Don't create user in users table here - will be created during onboarding
			// User will be redirected to onboarding flow to complete profile setup

			return { error: null }
		} catch {
			return { error: 'An unexpected error occurred' }
		}
	}

	const signOut = async (): Promise<{ error: string | null }> => {
		try {
			const { error } = await supabase.auth.signOut()
			return { error: error?.message || null }
		} catch {
			return { error: 'An unexpected error occurred' }
		}
	}

	const value: AuthContextType = {
		user,
		loading,
		signIn,
		signUp,
		signOut,
	}

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

// Liskov Substitution Principle: useAuth hook provides consistent interface
export function useAuth(): AuthContextType {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
