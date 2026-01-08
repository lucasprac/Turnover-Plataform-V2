/**
 * Login Page
 * 
 * Custom authentication page using Supabase Auth directly.
 */
import { useState, FormEvent } from 'react'
import { useAuth } from '../components/AuthProvider'
import { Navigate } from 'react-router-dom'

export default function LoginPage() {
    const { user, loading, signIn, signUp } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
            </div>
        )
    }

    // Redirect if already logged in
    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            const { error } = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password)

            if (error) {
                setError(error.message)
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="w-full max-w-md p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                        Turnover Analytics Platform
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {isSignUp ? 'Create your account' : 'Sign in to access the dashboard'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg p-6 shadow-sm" style={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))'
                    }}>
                        {error && (
                            <div className="mb-4 p-3 rounded text-sm" style={{
                                backgroundColor: 'hsl(0 85% 60% / 0.1)',
                                color: 'hsl(0 85% 60%)'
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 rounded-md text-sm"
                                    style={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--input))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 rounded-md text-sm"
                                    style={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--input))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2 px-4 rounded-md font-medium text-sm transition-colors"
                                style={{
                                    backgroundColor: 'hsl(var(--primary))',
                                    color: 'hsl(var(--primary-foreground))',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        className="font-medium underline"
                        style={{ color: 'hsl(var(--foreground))' }}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>

                <p className="text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Powered by Supabase Authentication
                </p>
            </div>
        </div>
    )
}
