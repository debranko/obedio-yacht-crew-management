/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error, errorInfo });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    The application encountered an unexpected error
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(this.props.showDetails !== false || process.env.NODE_ENV === 'development') && this.state.error && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Error Details:</h4>
                  <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-auto max-h-40">
                    <p className="text-destructive font-semibold">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                You can try refreshing the page or returning to the home page. If the problem
                persists, please contact support.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2 flex-wrap">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} size="sm">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              <Button onClick={this.handleClearAndReload} variant="destructive" size="sm">
                Clear Cache & Reload
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level Error Boundary
 * Catches errors within a specific page/route
 */
export class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg">Page Error</CardTitle>
              </div>
              <CardDescription>
                This page encountered an error and couldn't load
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
                <div className="bg-muted p-3 rounded text-xs font-mono mb-4 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Try refreshing the page or navigating to a different section.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Widget-level Error Boundary
 * Catches errors within dashboard widgets
 */
export class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="h-full border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-medium mb-1">Widget Error</p>
            <p className="text-xs text-muted-foreground mb-4">
              This widget failed to load
            </p>
            <Button size="sm" variant="outline" onClick={this.handleReset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to manually throw errors (for testing error boundaries)
 */
export function useThrowError() {
  return (error: Error | string) => {
    throw error instanceof Error ? error : new Error(error);
  };
}
