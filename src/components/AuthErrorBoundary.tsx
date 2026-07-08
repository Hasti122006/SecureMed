import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AuthErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Unknown error" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("App render error:", err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Something went wrong</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">{this.state.message}</p>
          <button
            type="button"
            className="text-primary underline text-sm"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
