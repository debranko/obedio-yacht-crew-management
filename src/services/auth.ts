// Frontend Authentication Service
// Handles login/logout and JWT token management

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('obedio-auth-token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      console.log('🔐 Login response:', { success: data.success, hasToken: !!(data.data?.token || data.token), hasUser: !!(data.data?.user || data.user) });

      // Backend returns token in data.data.token
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;

      if (response.ok && token) {
        this.token = token;
        localStorage.setItem('obedio-auth-token', token);
        console.log('✅ Token saved to localStorage:', token.substring(0, 20) + '...');

        // Store user info for easy access
        if (user) {
          localStorage.setItem('obedio-auth-user', JSON.stringify(user));
          console.log('✅ User saved to localStorage:', user.username);
        }

        return {
          success: true,
          token: token,
          user: user,
        };
      } else {
        console.error('❌ Login failed:', data.message);
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
    this.token = null;
    localStorage.removeItem('obedio-auth-token');
    localStorage.removeItem('obedio-auth-user');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current logged-in user
  getCurrentUser(): { id: string; username: string; name: string; role: string } | null {
    const userJson = localStorage.getItem('obedio-auth-user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  // Get Authorization header for API requests
  getAuthHeader(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }
    return {};
  }
}

export const authService = new AuthService();
export type { LoginCredentials, AuthResponse };