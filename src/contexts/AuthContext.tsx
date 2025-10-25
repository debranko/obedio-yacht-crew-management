/**
 * Authentication Context
 * Manages user authentication state and provides auth methods throughout the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role } from '../types/crew';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  department?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const API_BASE_URL = 'http://localhost:8080/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle auth:logout event
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      logout();
    };

    window.addEventListener('auth:logout' as any, handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout' as any, handleAuthLogout);
    };
  }, []);

  // Check for existing session on mount and verify token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('obedio-auth-user');
        const storedToken = localStorage.getItem('obedio-auth-token');

        if (storedUser && storedToken) {
          // Verify token with backend
          try {
            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.valid && data.user) {
                // Update user data from server (might have changed)
                const user: User = {
                  id: data.user.id,
                  name: data.user.name,
                  email: data.user.email,
                  role: data.user.role as Role,
                  avatar: data.user.avatar,
                  department: data.user.department,
                  username: data.user.username,
                };
                setUser(user);
                localStorage.setItem('obedio-auth-user', JSON.stringify(user));
              } else {
                throw new Error('Invalid token');
              }
            } else {
              throw new Error('Token verification failed');
            }
          } catch (error) {
            // Token is invalid, try to refresh it
            try {
              const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: storedToken }),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.success && refreshData.data) {
                  const { user: userData, token: newToken } = refreshData.data;

                  // Store new token
                  localStorage.setItem('obedio-auth-token', newToken);

                  // Update user
                  const user: User = {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role as Role,
                    avatar: userData.avatar,
                    department: userData.department,
                    username: userData.username,
                  };
                  setUser(user);
                  localStorage.setItem('obedio-auth-user', JSON.stringify(user));
                } else {
                  throw new Error('Failed to refresh token');
                }
              } else {
                throw new Error('Token refresh failed');
              }
            } catch (refreshError) {
              // Clear invalid session
              localStorage.removeItem('obedio-auth-user');
              localStorage.removeItem('obedio-auth-token');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Session check failed:', error);
        // Clear invalid session
        localStorage.removeItem('obedio-auth-user');
        localStorage.removeItem('obedio-auth-token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          if (response.status === 401) {
            errorMessage = error.message || 'Invalid username or password';
          } else if (response.status === 404) {
            errorMessage = 'User not found';
          } else {
            errorMessage = error.message || error.error || `Server error: ${response.status}`;
          }
        } catch {
          if (response.status === 401) {
            errorMessage = 'Invalid username or password';
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.data || !data.data.user || !data.data.token) {
        throw new Error('Invalid login response from server');
      }

      const { user: userData, token } = data.data;

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as Role,
        avatar: userData.avatar,
        department: userData.department,
        username: userData.username,
      };

      // Store in localStorage
      localStorage.setItem('obedio-auth-user', JSON.stringify(user));
      localStorage.setItem('obedio-auth-token', token);

      // Update state
      setUser(user);
    } catch (error) {
      console.error('[Auth] Login failed:', error);

      // Re-throw with better message if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if backend is running on http://localhost:8080');
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear user state
    setUser(null);

    // Clear localStorage
    localStorage.removeItem('obedio-auth-user');
    localStorage.removeItem('obedio-auth-token');

    // Optional: Call backend to invalidate token
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('obedio-auth-token')}`,
      },
    }).catch(error => {
      console.error('Logout error:', error);
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    // Update localStorage
    localStorage.setItem('obedio-auth-user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
