import * as React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GhanaBuild ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-rose-200 shadow-sm text-center">
            <div className="h-14 w-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Application Notice</h3>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              An unexpected interface error occurred. Details have been logged safely.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-slate-100 rounded-lg text-left text-xs text-slate-700 font-mono overflow-x-auto mb-5 border border-slate-200">
                {this.state.error.message}
              </pre>
            )}
            <Button variant="primary" size="md" onClick={this.handleReset} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
