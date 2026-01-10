/**
 * Authentication Provider
 * 
 * Provides real JWT-based authentication with login/logout functionality.
 * Stores tokens in localStorage for session persistence.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface User {
    id: string;
    email: string;
    name?: string;
}

interface Session {
    user: User;
    access_token: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

const AUTH_TOKEN_KEY = 'turnover_auth_token';
const AUTH_USER_KEY = 'turnover_auth_user';

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = localStorage.getItem(AUTH_TOKEN_KEY);
                const storedUser = localStorage.getItem(AUTH_USER_KEY);

                if (token && storedUser) {
                    // Verify token with backend
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        setSession({ user: userData, access_token: token });
                    } else {
                        // Token invalid, clear storage
                        localStorage.removeItem(AUTH_TOKEN_KEY);
                        localStorage.removeItem(AUTH_USER_KEY);
                    }
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const data = await response.json();
                return { error: new Error(data.detail || 'Login failed') };
            }

            const data = await response.json();
            const { access_token, user: userData } = data;

            // Store in localStorage
            localStorage.setItem(AUTH_TOKEN_KEY, access_token);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

            setUser(userData);
            setSession({ user: userData, access_token });

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const data = await response.json();
                return { error: new Error(data.detail || 'Registration failed') };
            }

            // Auto-login after registration
            return signIn(email, password);
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Always clear local state
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            setUser(null);
            setSession(null);
        }
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
