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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 AuthProvider state changed:', { 
      user: user ? `${user.name} (${user.role})` : 'null', 
      isLoading,
      isAuthenticated: !!user
    });
  }, [user, isLoading]);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking for existing session...');
      try {
        const storedUser = localStorage.getItem('obedio-auth-user');
        const storedToken = localStorage.getItem('obedio-auth-token');

        console.log('📦 localStorage check:', { 
          hasUser: !!storedUser, 
          hasToken: !!storedToken 
        });

        if (storedUser && storedToken) {
          console.log('✅ Found stored session, restoring...');
          // In production, verify token with backend
          // For now, restore from localStorage
          const userData = JSON.parse(storedUser);
          console.log('👤 Restored user:', userData);
          setUser(userData);
          console.log('✅ Session restored successfully!');
        } else {
          console.log('❌ No stored session found');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Clear invalid session
        localStorage.removeItem('obedio-auth-user');
        localStorage.removeItem('obedio-auth-token');
        console.log('🗑️ Cleared invalid session');
      } finally {
        console.log('🏁 Auth check complete, setting isLoading = false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔑 AuthContext.login called');
    try {
      setIsLoading(true);

      console.log('📡 Fetching http://localhost:3001/api/auth/login...');
      
      // Call backend API for authentication
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('🔴 Response not OK:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!data.success) {
        console.error('🔴 Data.success is false');
        throw new Error(data.message || 'Login failed');
      }

      if (!data.data || !data.data.user || !data.data.token) {
        console.error('🔴 Invalid data structure:', data);
        throw new Error('Invalid login response from server');
      }

      // Extract user and token from response
      const { user: userData, token } = data.data;
      console.log('👤 User data extracted:', userData);

      // Map backend user data to frontend User type
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as Role,
        avatar: userData.avatar,
        department: userData.department,
      };

      console.log('💾 Storing to localStorage...');
      // Store in localStorage
      localStorage.setItem('obedio-auth-user', JSON.stringify(user));
      localStorage.setItem('obedio-auth-token', token);
      console.log('📦 Stored user:', user);
      console.log('🔑 Stored token:', token.substring(0, 20) + '...');

      console.log('✅ Setting user state...');
      // Update state
      setUser(user);
      console.log('👤 User state set:', user);
      console.log('🎉 Login complete! isAuthenticated should be:', !!user);
    } catch (error) {
      console.error('Login error:', error);
      
      // Re-throw with better message if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if backend is running on http://localhost:3001');
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
    // fetch('http://localhost:3001/api/auth/logout', { method: 'POST', ... });
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
