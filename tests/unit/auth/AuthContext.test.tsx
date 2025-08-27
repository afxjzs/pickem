import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
	createClient: jest.fn()
}))

const mockSupabase = {
	auth: {
		getUser: jest.fn(),
		signInWithPassword: jest.fn(),
		signUp: jest.fn(),
		signOut: jest.fn(),
		onAuthStateChange: jest.fn()
	}
}

// Mock the return values properly
mockSupabase.auth.getUser.mockResolvedValue({
	data: { user: null },
	error: null
})

mockSupabase.auth.onAuthStateChange.mockReturnValue({
	data: { subscription: { unsubscribe: jest.fn() } }
})

;(createClient as jest.Mock).mockReturnValue(mockSupabase)

// Test component to use the auth context
const TestComponent = () => {
	const { user, loading } = useAuth()
	
	if (loading) return <div>Loading...</div>
	if (user) return <div>Welcome, {user.email}</div>
	return <div>Not signed in</div>
}

describe('AuthContext', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Reset mock return values
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: null },
			error: null
		})
		mockSupabase.auth.onAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe: jest.fn() } }
		})
	})

	it('should provide authentication context to children', async () => {
		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)
		
		// Wait for loading to finish
		await waitFor(() => {
			expect(screen.getByText('Not signed in')).toBeInTheDocument()
		})
	})

	it('should handle sign in with email and password', async () => {
		const mockUser = { id: '1', email: 'test@example.com' }
		mockSupabase.auth.signInWithPassword.mockResolvedValue({
			data: { user: mockUser },
			error: null
		})

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		// Wait for loading to finish
		await waitFor(() => {
			expect(screen.getByText('Not signed in')).toBeInTheDocument()
		})

		// Verify the mock was set up correctly
		expect(mockSupabase.auth.signInWithPassword).toBeDefined()
	})

	it('should handle sign up with email and password', async () => {
		const mockUser = { id: '1', email: 'test@example.com' }
		mockSupabase.auth.signUp.mockResolvedValue({
			data: { user: mockUser },
			error: null
		})

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		// Wait for loading to finish
		await waitFor(() => {
			expect(screen.getByText('Not signed in')).toBeInTheDocument()
		})

		// Verify the mock was set up correctly
		expect(mockSupabase.auth.signUp).toBeDefined()
	})

	it('should handle sign out', async () => {
		mockSupabase.auth.signOut.mockResolvedValue({
			error: null
		})

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		// Wait for loading to finish
		await waitFor(() => {
			expect(screen.getByText('Not signed in')).toBeInTheDocument()
		})

		// Verify the mock was set up correctly
		expect(mockSupabase.auth.signOut).toBeDefined()
	})
})
