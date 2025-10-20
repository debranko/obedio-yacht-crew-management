/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 */

import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  onNavigateToLogin: () => void;
}

export function ProtectedRoute({ children, onNavigateToLogin }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated (in effect to avoid state update during render)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigateToLogin();
    }
  }, [isLoading, isAuthenticated, onNavigateToLogin]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting to login
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
