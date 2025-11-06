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

// Use relative path - Vite proxy forwards /api to backend automatically
const API_BASE_URL = '/api';

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

  // Check for existing session on mount via HTTP-only cookie
  // Auth token stored in cookie (server runs 24/7), no localStorage needed
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [Auth] Starting session check...');
      console.log('🔍 [Auth] API_BASE_URL:', API_BASE_URL);

      try {
        // Verify session with backend - cookie sent automatically
        console.log('🔍 [Auth] Calling /auth/verify endpoint...');
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Send HTTP-only cookie
        });

        console.log('🔍 [Auth] Response status:', response.status, response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [Auth] Verify response data:', data);

          // Backend returns { success, valid, user } directly (no wrapper)
          if (data.success && data.valid && data.user) {
            // Session is valid, set user from server
            console.log('✅ [Auth] Session VALID - restoring user:', data.user.username);
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
          } else {
            // Invalid session
            console.warn('⚠️ [Auth] Session INVALID - data structure wrong:', data);
            setUser(null);
          }
        } else {
          // No valid session
          console.warn('⚠️ [Auth] No valid session - status:', response.status);
          const errorData = await response.json().catch(() => null);
          console.warn('⚠️ [Auth] Error data:', errorData);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [Auth] Session check failed:', error);
        setUser(null);
      } finally {
        console.log('🏁 [Auth] Session check complete. isLoading = false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Backend sets HTTP-only cookie on successful login
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Receive HTTP-only cookie
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

      if (!data.data || !data.data.user) {
        throw new Error('Invalid login response from server');
      }

      const { user: userData } = data.data;

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as Role,
        avatar: userData.avatar,
        department: userData.department,
        username: userData.username,
      };

      // Auth token in HTTP-only cookie (server manages 24/7)
      // No localStorage needed - state in memory only
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

    // Call backend to clear HTTP-only cookie
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Send cookie to be cleared
    }).catch(error => {
      console.error('Logout error:', error);
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    // State in memory only - no localStorage needed
    setUser(updatedUser);
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
