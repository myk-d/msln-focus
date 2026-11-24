import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RouteErrorBoundaryProps {
  resetKey: string;
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

function RouteErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="font-display text-lg font-semibold text-text">{t('errors.pageLoadTitle')}</h2>
      <p className="max-w-sm text-sm text-muted">{t('errors.pageLoadDescription')}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-hover"
      >
        <RefreshCw size={14} />
        {t('errors.reload')}
      </button>
    </div>
  );
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <RouteErrorFallback />;
    }
    return this.props.children;
  }
}
