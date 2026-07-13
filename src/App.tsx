import { BrowserRouter } from 'react-router-dom';
import { TaskStoreProvider } from './context/TaskStoreContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { FocusDashboard } from './components/FocusDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <TaskStoreProvider>
        <PomodoroProvider>
          <FocusDashboard />
        </PomodoroProvider>
      </TaskStoreProvider>
    </BrowserRouter>
  );
}
