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
		let mounted = true
		
		console.log('[AuthContext] useEffect started, mounted:', mounted)
		
		// Get initial user session
		const getUser = async () => {
			console.log('[AuthContext] getUser called')
			try {
				const startTime = Date.now()
				const { data: { user }, error } = await supabase.auth.getUser()
				const duration = Date.now() - startTime
				
				console.log('[AuthContext] getUser response:', {
					hasUser: !!user,
					userId: user?.id,
					userEmail: user?.email,
					hasError: !!error,
					errorMessage: error?.message,
					duration: `${duration}ms`,
					mounted
				})
				
				// Check if component is still mounted before updating state
				if (!mounted) {
					console.log('[AuthContext] Component unmounted, skipping state update')
					return
				}
				
				// Handle auth errors gracefully - no session is not an error
				// Supabase returns an error when there's no session, which is expected for logged-out users
				if (error) {
					console.log('[AuthContext] Auth error (may be expected for logged-out users):', {
						message: error.message,
						isSessionError: error.message?.includes('session') || error.message?.includes('Auth session missing')
					})
					// Any auth error means user is not logged in - this is fine
					// Don't log session-related errors as they're expected
					if (!error.message?.includes('session') && !error.message?.includes('Auth session missing')) {
						console.error('[AuthContext] Unexpected auth error:', error)
					}
					console.log('[AuthContext] Setting user to null and loading to false')
					setUser(null)
					setLoading(false)
					return
				}
				
				console.log('[AuthContext] Setting user and loading to false')
				setUser(user)
				// Set loading to false immediately after getting user
				// Don't wait for user table check - that can happen in background
				setLoading(false)
				
				// Only ensure user exists if they're authenticated
				// Check if user exists in users table first before creating (non-blocking)
				if (user) {
					console.log('[AuthContext] Checking if user exists in users table:', user.id)
					// Run this in background - don't block the loading state
					Promise.resolve(supabase
						.from('users')
						.select('id')
						.eq('id', user.id)
						.maybeSingle())
						.then(({ data: existingUser, error: checkError }) => {
							console.log('[AuthContext] User check result:', {
								hasExistingUser: !!existingUser,
								checkError: checkError?.message,
								mounted
							})
							if (!mounted) return
							// Only call create endpoint if user doesn't exist
							if (!existingUser) {
								console.log('[AuthContext] User not in database, creating...')
								return fetch('/api/users/create', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									credentials: 'include',
								}).then(() => {
									console.log('[AuthContext] User creation API called successfully')
								})
							} else {
								console.log('[AuthContext] User already exists in database')
							}
						})
						.catch((error: unknown) => {
							console.error('[AuthContext] Error checking user exists:', error)
							// Non-critical - user can still use the app
						})
				}
			} catch (error) {
				if (!mounted) {
					console.log('[AuthContext] Component unmounted during error handling')
					return
				}
				console.error('[AuthContext] Exception in getUser:', error)
				setUser(null)
				setLoading(false)
			}
		}

		getUser()

		// Listen for auth state changes
		console.log('[AuthContext] Setting up auth state change listener')
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				console.log('[AuthContext] Auth state changed:', {
					event,
					hasSession: !!session,
					hasUser: !!session?.user,
					userId: session?.user?.id,
					mounted
				})
				
				if (!mounted) {
					console.log('[AuthContext] Component unmounted, ignoring auth state change')
					return
				}
				
				console.log('[AuthContext] Updating user state from auth state change')
				setUser(session?.user ?? null)
				setLoading(false)
				
				// If user just signed up or signed in, ensure they exist in users table
				if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
					console.log('[AuthContext] User signed in/up, ensuring user exists in database')
					try {
						// Check if user exists first
						const { data: existingUser, error: checkError } = await supabase
							.from('users')
							.select('id')
							.eq('id', session.user.id)
							.maybeSingle()
						
						console.log('[AuthContext] User check after sign in:', {
							hasExistingUser: !!existingUser,
							checkError: checkError?.message,
							mounted
						})
						
						if (!mounted) {
							console.log('[AuthContext] Component unmounted during user check')
							return
						}
						
						// Only create if doesn't exist
						if (!existingUser) {
							console.log('[AuthContext] Creating user in database...')
							const createResponse = await fetch('/api/users/create', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								credentials: 'include',
							})
							console.log('[AuthContext] User creation response:', createResponse.status)
						} else {
							console.log('[AuthContext] User already exists in database')
						}
					} catch (error) {
						console.error('[AuthContext] Error ensuring user exists in users table:', error)
						// Non-critical - user can still use the app
					}
				}
			}
		)

		return () => {
			console.log('[AuthContext] Cleaning up - unmounting and unsubscribing')
			mounted = false
			subscription.unsubscribe()
		}
	}, [])

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
