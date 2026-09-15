// @ts-nocheck
import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isAuthError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isAuthError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isAuthError = error.message?.includes("Refresh Token") || error.message?.includes("refresh_token") || error.message?.includes("Invalid Refresh Token");
    return { hasError: true, error, errorInfo: null, isAuthError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Check for auth errors to handle gracefully
    if (this.state.isAuthError) {
      try {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
          if (key.includes("supabase-auth")) {
            window.localStorage.removeItem(key);
          }
        }
      } catch (e) {}
      window.location.href = "/login";
      return;
    }
    
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.isAuthError) {
        return null; // Render nothing while redirecting
      }
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-4 bg-red-900/50 text-white border border-red-500 rounded-md overflow-auto text-left m-4 relative z-[999999]">
          <h2 className="text-xl font-bold mb-4">React Error Captured</h2>
          <pre className="text-sm font-mono p-2 bg-black/50 overflow-x-auto whitespace-pre-wrap">
            {this.state.error && this.state.error.toString()}
            {"\n"}
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
