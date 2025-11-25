import React, { useState } from 'react';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/Dashboard';
import { BrainDump } from './components/BrainDump';
import { PlanReview } from './components/PlanReview';
import { FocusMode } from './components/FocusMode';
import { AppView, Task, UserState } from './types';
import { MOTIVATIONAL_QUOTES } from './constants';
import { Trophy } from 'lucide-react';

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [userState, setUserState] = useState<UserState>({
    name: 'Friend',
    energy: 'medium',
    streak: 4,
    tasksCompletedToday: 0
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [aiMessage, setAiMessage] = useState('');

  // Handlers
  const handlePlanCreated = (newTasks: Task[], message: string) => {
    setTasks(newTasks);
    setAiMessage(message);
    setView(AppView.PLAN_REVIEW);
  };

  const handleUpdateTasks = (updatedTasks: Task[], message?: string) => {
    setTasks(updatedTasks);
    if (message) setAiMessage(message);
  };

  const handleTaskComplete = (taskId: string) => {
    // Optimistic update
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isCompleted: true } : t);
    setTasks(updatedTasks);
    setUserState(prev => ({
        ...prev,
        tasksCompletedToday: prev.tasksCompletedToday + 1
    }));
    
    // Check if more tasks
    if (currentTaskIndex < tasks.length - 1) {
      setView(AppView.CELEBRATION);
      setTimeout(() => {
        setCurrentTaskIndex(prev => prev + 1);
        setView(AppView.FOCUS_MODE);
      }, 2500); // Show celebration for 2.5s
    } else {
      setView(AppView.CELEBRATION);
      setTimeout(() => {
        setView(AppView.DASHBOARD); // Or a "Day Complete" summary
      }, 3000);
    }
  };

  const handleTaskSkip = (taskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isSkipped: true } : t);
    setTasks(updatedTasks);
    if (currentTaskIndex < tasks.length - 1) {
       setCurrentTaskIndex(prev => prev + 1);
    } else {
        setView(AppView.DASHBOARD);
    }
  };

  // Render Views
  const renderView = () => {
    switch (view) {
      case AppView.DASHBOARD:
        return (
          <Dashboard
            userState={userState}
            onStartBrainDump={() => setView(AppView.BRAIN_DUMP)}
            setUserEnergy={(energy) => setUserState({ ...userState, energy })}
          />
        );
      case AppView.BRAIN_DUMP:
        return (
          <BrainDump
            userEnergy={userState.energy}
            onPlanCreated={handlePlanCreated}
          />
        );
      case AppView.PLAN_REVIEW:
        return (
          <PlanReview
            tasks={tasks}
            aiMessage={aiMessage}
            onUpdateTasks={handleUpdateTasks}
            onStartDay={() => setView(AppView.FOCUS_MODE)}
          />
        );
      case AppView.FOCUS_MODE:
        return (
          <FocusMode
            task={tasks[currentTaskIndex]}
            onComplete={handleTaskComplete}
            onSkip={handleTaskSkip}
            onBack={() => setView(AppView.PLAN_REVIEW)}
          />
        );
      case AppView.CELEBRATION:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-indigo-600 text-white text-center fade-in">
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Trophy size={48} />
             </div>
             <h2 className="text-3xl font-bold mb-4">Task Complete!</h2>
             <p className="text-indigo-100 text-lg mb-8">
                {MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]}
             </p>
             <div className="text-sm opacity-70">Loading next task...</div>
          </div>
        );
      default:
        return <div>Error</div>;
    }
  };

  return (
    <Layout>
        {renderView()}
    </Layout>
  );
}

export default App;