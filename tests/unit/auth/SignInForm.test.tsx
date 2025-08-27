import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignInForm } from '@/components/auth/SignInForm'

// Mock the auth context
const mockSignIn = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('@/lib/contexts/AuthContext', () => ({
	useAuth: () => mockUseAuth()
}))

describe('SignInForm', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockUseAuth.mockReturnValue({
			signIn: mockSignIn,
			loading: false
		})
	})

	it('should render sign in form with email and password fields', () => {
		render(<SignInForm />)
		
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
	})

	it('should handle form submission with valid credentials', async () => {
		mockSignIn.mockResolvedValue({ error: null })

		render(<SignInForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole('button', { name: /sign in/i })

		fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'password123' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
		})
	})

	it('should display error message when sign in fails', async () => {
		mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

		render(<SignInForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole('button', { name: /sign in/i })

		fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
		})
	})

	it('should disable form submission while loading', () => {
		mockUseAuth.mockReturnValue({
			signIn: mockSignIn,
			loading: true
		})

		render(<SignInForm />)

		const submitButton = screen.getByRole('button', { name: /sign in/i })
		expect(submitButton).toBeDisabled()
	})
})
