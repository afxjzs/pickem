import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignUpForm } from '@/components/auth/SignUpForm'

// Mock the auth context
const mockSignUp = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('@/lib/contexts/AuthContext', () => ({
	useAuth: () => mockUseAuth()
}))

describe('SignUpForm', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockUseAuth.mockReturnValue({
			signUp: mockSignUp,
			loading: false
		})
	})

	it('should render sign up form with email and password fields', () => {
		render(<SignUpForm />)
		
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
	})

	it('should handle form submission with valid credentials', async () => {
		mockSignUp.mockResolvedValue({ error: null })

		render(<SignUpForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole('button', { name: /sign up/i })

		fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'password123' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123')
		})
	})

	it('should display error message when sign up fails', async () => {
		mockSignUp.mockResolvedValue({ error: 'Email already exists' })

		render(<SignUpForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole('button', { name: /sign up/i })

		fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'password123' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith('existing@example.com', 'password123')
		})
	})

	it('should disable form submission while loading', () => {
		mockUseAuth.mockReturnValue({
			signUp: mockSignUp,
			loading: true
		})

		render(<SignUpForm />)

		const submitButton = screen.getByRole('button', { name: /sign up/i })
		expect(submitButton).toBeDisabled()
	})
})
