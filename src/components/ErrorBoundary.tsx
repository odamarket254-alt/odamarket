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
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
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
