/**
 * Login Page
 * Authentication page for crew members
 */

import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { AlertCircle, Loader2, Ship } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('🔐 Login attempt started...', { email, password: '***' });

    if (!email || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📤 Calling login function...');
      
      await login(email, password);
      
      console.log('✅ Login successful!');
      toast.success('Welcome aboard! 🛥️');
    } catch (err) {
      console.error('❌ Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('🏁 Login process finished');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Ship className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">OBEDIO</h1>
          <p className="text-sm text-muted-foreground">
            Yacht Crew Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username or Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Username or Email</Label>
            <Input
              id="email"
              type="text"
              placeholder="admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Demo Credentials Info */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Login: <span className="font-medium">admin</span> / <span className="font-medium">password</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
