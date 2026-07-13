import { BrowserRouter } from 'react-router-dom';
import { TaskStoreProvider } from './context/TaskStoreContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { EventStoreProvider } from './context/EventStoreContext';
import { FocusDashboard } from './components/FocusDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <TaskStoreProvider>
        <EventStoreProvider>
          <PomodoroProvider>
            <FocusDashboard />
          </PomodoroProvider>
        </EventStoreProvider>
      </TaskStoreProvider>
    </BrowserRouter>
  );
}
