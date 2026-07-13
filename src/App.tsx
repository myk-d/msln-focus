import { BrowserRouter } from 'react-router-dom';
import { TaskStoreProvider } from './context/TaskStoreContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { EventStoreProvider } from './context/EventStoreContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { FocusDashboard } from './components/FocusDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <TaskStoreProvider>
          <EventStoreProvider>
            <PomodoroProvider>
              <FocusDashboard />
            </PomodoroProvider>
          </EventStoreProvider>
        </TaskStoreProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
