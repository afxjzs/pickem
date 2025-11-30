"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Single Responsibility Principle: This component only handles sign-in form logic
export function SignInForm() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const { signIn, loading, user } = useAuth()
	const router = useRouter()

	// Redirect if already signed in
	useEffect(() => {
		if (user && !loading) {
			router.push("/dashboard")
		}
	}, [user, loading, router])

	// Helper function to determine if an error is a user validation error (not logged)
	const isUserValidationError = (error: string): boolean => {
		const userErrors = [
			"Invalid credentials",
			"Invalid login credentials",
			"Email not confirmed",
			"Invalid email",
			"User not found",
			"Wrong password",
			"Account not found",
			"Email or password is incorrect",
		]
		return userErrors.some((userError) => error.includes(userError))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError(null)

		try {
			const { error } = await signIn(email, password)
			if (error) {
				setError(error)
				// Only log application errors, not user validation errors
				if (!isUserValidationError(error)) {
					console.error("Sign in error:", error)
				}
			} else {
				// Success - redirect to dashboard
				router.push("/dashboard")
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred"
			setError(errorMessage)
			// Always log unexpected errors as they indicate application issues
			console.error("Unexpected error:", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isFormDisabled = loading || isSubmitting

	return (
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#4580BC' }}>
			<div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-lg p-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-galindo text-[#265387]">
						Sign in to your account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Or{" "}
						<Link
							href="/signup"
							className="font-medium text-[#4580BC] hover:text-[#265387]"
						>
							create a new account
						</Link>
					</p>
				</div>

				{error && (
					<div className="bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-md p-4">
						<div className="text-sm text-[#EF4444]">{error}</div>
					</div>
				)}

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC] focus:z-10 sm:text-sm"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isFormDisabled}
							/>
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC] focus:z-10 sm:text-sm"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isFormDisabled}
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isFormDisabled}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#4580BC] hover:bg-[#265387] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4580BC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubmitting ? "Signing in..." : "Sign in"}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
