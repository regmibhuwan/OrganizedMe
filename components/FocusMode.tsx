import React, { useState, useEffect, useRef } from 'react';
import { Task, MicroStep } from '../types';
import { breakDownTask, getCoaching } from '../services/gemini';
import { Check, X, Play, Pause, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';

interface FocusModeProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onBack: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ task, onComplete, onSkip, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(task.estimatedMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [microSteps, setMicroSteps] = useState<MicroStep[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState<string | null>(null);

  // We use a ref for the target end time to ensure accuracy even if browser throttles JS in background
  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial setup when task changes
  useEffect(() => {
    setTimeLeft(task.estimatedMinutes * 60);
    setIsActive(false);
    endTimeRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setMicroSteps([]);
    setCoachingMessage(null);
    setShowHelp(false);
  }, [task]);

  // Timer Tick Logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.ceil((endTimeRef.current - now) / 1000);
          
          if (remaining <= 0) {
            setTimeLeft(0);
            setIsActive(false);
            endTimeRef.current = null;
            if (timerRef.current) clearInterval(timerRef.current);
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 500); // Check twice a second for smoothness
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const toggleTimer = () => {
    if (isActive) {
      // PAUSE: Just stop the interval, timeLeft state holds the current visual time
      setIsActive(false);
      endTimeRef.current = null;
    } else {
      // START: Calculate new end time based on current timeLeft
      // This ensures if you resume after 5 mins or 5 seconds, it resumes from where you left off
      const targetTime = Date.now() + (timeLeft * 1000);
      endTimeRef.current = targetTime;
      setIsActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((task.estimatedMinutes * 60 - timeLeft) / (task.estimatedMinutes * 60)) * 100;

  const handleBreakdown = async () => {
    setIsLoadingSteps(true);
    const steps = await breakDownTask(task.title);
    setMicroSteps(steps);
    setIsLoadingSteps(false);
    setShowHelp(false);
  };

  const handleStuck = async () => {
    setCoachingMessage("Thinking...");
    const msg = await getCoaching(task.title, "overwhelmed");
    setCoachingMessage(msg);
  };

  const handleMicroStepToggle = (id: string) => {
    setMicroSteps(steps => steps.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-900 text-white relative overflow-hidden">
        {/* Background Ambient Effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 z-10">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <ArrowLeft size={20} />
            </button>
            <div className="text-xs font-medium tracking-widest text-slate-400 uppercase">Focus Mode</div>
            <button onClick={() => setShowHelp(!showHelp)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <HelpCircle size={20} />
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 relative">
            
            {/* Timer Ring */}
            <div className="relative mb-12">
                <svg className="w-64 h-64 transform -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-800"
                    />
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        className="text-indigo-500 transition-all duration-500 ease-linear"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold font-mono tracking-tighter">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-slate-400 mt-2 text-sm">
                        {isActive ? 'Keep going' : 'Ready?'}
                    </span>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2 px-4 leading-tight">
                {task.title}
            </h2>
            <p className="text-slate-400 text-sm mb-8">{task.estimatedMinutes} minute target</p>

            {/* Controls */}
            <div className="flex items-center space-x-6">
                 <button 
                    onClick={() => onSkip(task.id)}
                    className="flex flex-col items-center space-y-2 text-slate-500 hover:text-white transition-colors"
                >
                    <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center">
                        <X size={20} />
                    </div>
                    <span className="text-xs">Skip</span>
                </button>

                <button 
                    onClick={toggleTimer}
                    className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-900/50 transition-transform active:scale-95"
                >
                    {isActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
                </button>

                <button 
                    onClick={() => onComplete(task.id)}
                    className="flex flex-col items-center space-y-2 text-green-400 hover:text-green-300 transition-colors"
                >
                    <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-800 flex items-center justify-center">
                        <Check size={20} />
                    </div>
                    <span className="text-xs">Done</span>
                </button>
            </div>
        </div>

        {/* Micro-Steps Drawer (Overlay) */}
        {(microSteps.length > 0) && (
             <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-3xl p-6 z-20 shadow-2xl animate-slide-up max-h-[50vh] overflow-y-auto">
                 <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6" />
                 <h3 className="font-bold text-lg mb-4 text-indigo-300">Micro-Steps</h3>
                 <div className="space-y-3">
                     {microSteps.map(step => (
                         <div 
                            key={step.id}
                            onClick={() => handleMicroStepToggle(step.id)}
                            className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${step.isCompleted ? 'bg-green-900/20 text-green-400' : 'bg-slate-700'}`}
                        >
                            <span className={step.isCompleted ? 'line-through opacity-50' : ''}>{step.title}</span>
                            {step.isCompleted && <Check size={16} />}
                         </div>
                     ))}
                 </div>
                 {microSteps.every(s => s.isCompleted) && (
                     <button onClick={() => onComplete(task.id)} className="w-full mt-6 py-3 bg-green-600 rounded-xl font-bold">Complete Main Task</button>
                 )}
             </div>
        )}

        {/* Help Sheet */}
        {showHelp && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end">
                <div className="w-full bg-white text-slate-900 rounded-t-3xl p-6 pb-10 fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Stuck? Let's fix it.</h3>
                        <button onClick={() => setShowHelp(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                    </div>
                    
                    {coachingMessage ? (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                            <p className="font-medium text-indigo-900">Coach AI says:</p>
                            <p className="mt-2 text-slate-700">{coachingMessage}</p>
                            <button onClick={() => setCoachingMessage(null)} className="mt-4 text-indigo-600 text-sm font-semibold">Ask something else</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={handleBreakdown} disabled={isLoadingSteps} className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-left flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-indigo-900">Break it down</div>
                                    <div className="text-sm text-indigo-700">Make this task smaller</div>
                                </div>
                                {isLoadingSteps ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <ChevronRight className="text-indigo-400 group-hover:translate-x-1 transition-transform" />}
                            </button>

                            <button onClick={handleStuck} className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-xl text-left flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-orange-900">I just can't start</div>
                                    <div className="text-sm text-orange-700">Get a pep talk</div>
                                </div>
                                <ChevronRight className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button onClick={() => { setTimeLeft(60); setIsActive(true); setShowHelp(false); }} className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-xl text-left flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-green-900">Just 1 minute</div>
                                    <div className="text-sm text-green-700">Set timer to 60 seconds</div>
                                </div>
                                <ChevronRight className="text-green-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

// Simple loader helper
const Loader2 = ({className, size}: {className?: string, size?: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);