import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// --- ТИПИ ---
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  // Стейт для PiP вікна
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Стейт для Pomodoro
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Стейт для Todo
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Написати базову архітектуру додатка', completed: true },
    { id: '2', text: 'Протестувати роботу Document PiP', completed: false },
    { id: '3', text: 'Додати синхронізацію стилей Tailwind', completed: false },
  ]);
  const [newTodoText, setNewTodoText] = useState('');

  // Логіка таймера
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        setIsActive(false);
        alert('Час вийшов! Зробіть коротку перерву.');
        return;
      }
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Функції для Todo
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodoText, completed: false }]);
    setNewTodoText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // Функція для копіювання стилей Tailwind у нове вікно
  const copyStyles = (targetDoc: Document) => {
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        if (styleSheet.cssRules) {
          const newStyle = targetDoc.createElement('style');
          Array.from(styleSheet.cssRules).forEach((rule) => {
            newStyle.appendChild(targetDoc.createTextNode(rule.cssText));
          });
          targetDoc.head.appendChild(newStyle);
        }
      } catch {
        // Пропускаємо крос-доменні стилі (наприклад, Google Fonts лінки)
      }
    });
  };

  // Запуск Document Picture-in-Picture
  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const win = await window.documentPictureInPicture.requestWindow({
        width: 360,
        height: 500, // Робимо вищим, щоб помістився список задач
      });

      copyStyles(win.document);
      
      // Додамо темний або світлий бекграунд на body нового вікна
      win.document.body.className = "bg-slate-900 text-white antialiased";

      win.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(win);
    } catch (error) {
      console.error('Помилка PiP API:', error);
    }
  };

  // Компонент інтерфейсу (використовуємо класи Tailwind)
  const renderDashboard = (isInsidePiP: boolean) => (
    <div className={`p-4 flex flex-col h-full ${isInsidePiP ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800 rounded-xl shadow-md border'}`}>
      
      {/* Секція Помодоро */}
      <div className="text-center pb-4 border-b border-slate-700/30">
        <div className="text-4xl font-mono font-bold tracking-tight mb-2 text-rose-500">
          {formatTime(timeLeft)}
        </div>
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${isActive ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}
          >
            {isActive ? 'Пауза' : 'Старт'}
          </button>
          <button 
            onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }}
            className="px-3 py-1 rounded text-sm bg-slate-600 text-white font-medium hover:bg-slate-500 transition"
          >
            Скидання
          </button>
        </div>
      </div>

      {/* Секція Todo (А-ля TickTick) */}
      <div className="flex-1 flex flex-col mt-4 min-h-50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Задачі фокусу</h3>
        
        {/* Форма додавання */}
        <form onSubmit={addTodo} className="flex gap-1 mb-3">
          <input 
            type="text" 
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Додати задачу..." 
            className="flex-1 px-2 py-1 text-sm rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
          />
          <button type="submit" className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-sm rounded font-bold">+</button>
        </form>

        {/* Список */}
        <div className="overflow-y-auto flex-1 max-h-[260px] pr-1 space-y-2">
          {todos.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center mt-4">Усі задачі виконано! 🎉</p>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700/20 group">
                <label className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                  <input 
                    type="checkbox" 
                    checked={todo.completed} 
                    onChange={() => toggleTodo(todo.id)}
                    className="rounded border-slate-600 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span className={todo.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                    {todo.text}
                  </span>
                </label>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="text-slate-500 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition px-1"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-slate-100 rounded-2xl">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">VelloFocus 🎯</h1>
        <p className="text-sm text-slate-600 mt-1">Таймер та TickTick-список завжди перед очима</p>
      </header>

      <div className="mb-6 flex justify-center">
        <button 
          onClick={togglePiP}
          className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all transform active:scale-95"
        >
          {pipWindow ? '⚡ Повернути панель на сайт' : '🚀 Відкрити вікно поверх усіх програм'}
        </button>
      </div>

      {/* Якщо вікно відкрито — рендеримо через Портал у PiP, якщо ні — показуємо на сторінці */}
      {pipWindow 
        ? createPortal(renderDashboard(true), pipWindow.document.body)
        : renderDashboard(false)
      }
    </div>
  );
}