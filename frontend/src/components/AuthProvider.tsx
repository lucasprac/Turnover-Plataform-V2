/**
 * Authentication Provider (Mock)
 * 
 * Mock provider since Supabase has been removed.
 * Simulates an authenticated user session.
 */
import React, { createContext, useContext, useState, ReactNode } from 'react'

// Mock types
interface User {
    id: string
    email?: string
}

interface Session {
    user: User
    access_token: string
}

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    // Default to a dummy user so the app behaves as if logged in
    const dummyUser = { id: 'dummy-user', email: 'user@example.com' }
    const dummySession = { user: dummyUser, access_token: 'dummy-token' }

    const [user] = useState<User | null>(dummyUser)
    const [session] = useState<Session | null>(dummySession)
    const [loading] = useState(false)

    const signIn = async () => ({ error: null })
    const signUp = async () => ({ error: null })
    const signOut = async () => { }

    const value = {
        user,
        session,
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

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
