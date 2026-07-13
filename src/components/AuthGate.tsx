import { useAuth } from '../context/AuthContext';
import { ConfirmProvider } from '../context/ConfirmContext';
import { TaskStoreProvider } from '../context/TaskStoreContext';
import { EventStoreProvider } from '../context/EventStoreContext';
import { PomodoroProvider } from '../context/PomodoroContext';
import { WelcomePage } from './WelcomePage';
import { FocusDashboard } from './FocusDashboard';

// The data-layer providers (and therefore every useFirestoreCollection/
// useFirestoreValue call inside them) only ever mount once a user is signed
// in — signing out unmounts the whole subtree, so no stale-uid subscription
// can leak into a different account signing in afterward.
export function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) return <WelcomePage />;

  return (
    <ConfirmProvider>
      <TaskStoreProvider>
        <EventStoreProvider>
          <PomodoroProvider>
            <FocusDashboard />
          </PomodoroProvider>
        </EventStoreProvider>
      </TaskStoreProvider>
    </ConfirmProvider>
  );
}
