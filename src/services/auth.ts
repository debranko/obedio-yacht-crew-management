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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

      if (response.ok && data.token) {
        this.token = data.token;
        localStorage.setItem('obedio-auth-token', data.token);
        
        return {
          success: true,
          token: data.token,
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
    this.token = null;
    localStorage.removeItem('obedio-auth-token');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
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