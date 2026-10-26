import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level error boundary.
 *
 * Catches render-time exceptions so a single broken view never leaves the user
 * with a blank screen — and, importantly, so raw stack traces are never
 * rendered into the DOM. Details are reported to the console only.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the detail in the developer console; never render it to end users.
    console.error('Unhandled UI error captured by ErrorBoundary:', error.message);
    console.error('Component stack:', info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-50 px-6 py-16">
          <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-sm border border-emerald-100 p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">
              We hit an unexpected problem while displaying this page. Reloading usually fixes it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Reload page
              </button>
              <a
                href="#/"
                onClick={() => this.setState({ hasError: false })}
                className="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Back to home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
