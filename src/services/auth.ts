// Frontend Authentication Service
// DEPRECATED: Use AuthContext instead for authentication
// This file kept for backward compatibility but should not be used
// Auth now handled via HTTP-only cookies (server runs 24/7)

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
  message?: string;
}

const API_BASE_URL = 'http://localhost:8080/api';

class AuthService {
  constructor() {
    // Auth handled by HTTP-only cookies - no client-side token storage
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Backend sets HTTP-only cookie on successful login
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Receive HTTP-only cookie
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Token stored in HTTP-only cookie by backend
        return {
          success: true,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error - unable to connect to server',
      };
    }
  }

  logout(): void {
    // Backend clears HTTP-only cookie
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }

  getToken(): string | null {
    // Token in HTTP-only cookie - not accessible from JavaScript
    return null;
  }

  isAuthenticated(): boolean {
    // Use AuthContext.isAuthenticated instead
    console.warn('AuthService.isAuthenticated() is deprecated. Use AuthContext instead.');
    return false;
  }

  // Get Authorization header for API requests
  getAuthHeader(): Record<string, string> {
    // Auth via HTTP-only cookie - no header needed
    return {};
  }
}

export const authService = new AuthService();
export type { LoginCredentials, AuthResponse };