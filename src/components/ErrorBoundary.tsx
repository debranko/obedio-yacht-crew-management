import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught error:', error);
    console.error('🔴 Component stack:', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="bg-muted p-4 rounded-lg text-left">
              <pre className="text-xs overflow-auto">
                {this.state.error?.stack}
              </pre>
            </div>
            <button
              onClick={() => {
                // Clear all localStorage and reload
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
