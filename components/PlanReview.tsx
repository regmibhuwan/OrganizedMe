import React, { useState } from 'react';
import { Task, TaskCategory } from '../types';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '../constants';
import { updatePlanWithFeedback } from '../services/gemini';
import { Play, ArrowRight, Clock, Edit2, Check, ChevronUp, ChevronDown, Trash2, Sparkles, Loader2 } from 'lucide-react';

interface PlanReviewProps {
  tasks: Task[];
  aiMessage: string;
  onStartDay: () => void;
  onUpdateTasks: (tasks: Task[], message?: string) => void;
}

export const PlanReview: React.FC<PlanReviewProps> = ({ tasks, aiMessage, onStartDay, onUpdateTasks }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  const totalTime = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  // Manual Edit Handlers
  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tasks.length - 1) return;
    
    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];
    onUpdateTasks(newTasks);
  };

  const updateTime = (id: string, change: number) => {
    const newTasks = tasks.map(t => {
        if (t.id === id) {
            const newTime = Math.max(1, t.estimatedMinutes + change);
            return { ...t, estimatedMinutes: newTime };
        }
        return t;
    });
    onUpdateTasks(newTasks);
  };

  const deleteTask = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
  };

  // AI Re-organize Handler
  const handleAIUpdate = async () => {
    if (!feedbackInput.trim()) return;
    setIsProcessingAI(true);
    try {
        const result = await updatePlanWithFeedback(tasks, feedbackInput);
        onUpdateTasks(result.tasks, result.message);
        setFeedbackInput('');
        // Optional: Exit edit mode on success? kept open for now in case they want to verify.
    } catch (e) {
        alert("Couldn't update plan. Try again.");
    } finally {
        setIsProcessingAI(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative h-full">
      
      {/* Header Area */}
      <div className="p-6 pb-2 bg-white border-b border-slate-100 shadow-sm z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Adjust Your Plan' : 'Your Roadmap'}</h2>
            <div className="text-sm font-medium text-slate-500 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              <span>Total: ~{Math.floor(totalTime / 60)}h {totalTime % 60}m</span>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${isEditing ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {isEditing ? <Check size={16} className="mr-1" /> : <Edit2 size={16} className="mr-1" />}
            <span>{isEditing ? 'Done' : 'Adjust'}</span>
          </button>
        </div>
        
        {!isEditing && (
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start space-x-3 mb-2">
            <span className="text-xl">🤖</span>
            <p className="text-indigo-900 font-medium text-sm leading-relaxed">{aiMessage}</p>
            </div>
        )}
      </div>

      {/* Scrollable Task List */}
      <div className="flex-1 overflow-y-auto p-6 pb-40 space-y-3">
        {tasks.length === 0 && (
            <div className="text-center text-slate-400 py-10">No tasks left!</div>
        )}
        
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className={`bg-white rounded-xl border shadow-sm transition-all ${isEditing ? 'p-3 border-indigo-200' : 'p-4 border-slate-100'}`}
          >
            <div className="flex items-center space-x-3">
              {/* Edit Mode: Reorder Handles */}
              {isEditing && (
                  <div className="flex flex-col space-y-1 mr-1">
                      <button onClick={() => moveTask(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20"><ChevronUp size={20} /></button>
                      <button onClick={() => moveTask(index, 'down')} disabled={index === tasks.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20"><ChevronDown size={20} /></button>
                  </div>
              )}

              {/* Icon */}
              <div className={`flex-shrink-0 flex items-center justify-center rounded-full bg-slate-50 text-lg ${isEditing ? 'w-8 h-8' : 'w-10 h-10'}`}>
                {CATEGORY_EMOJIS[task.category] || '📌'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className={`font-semibold text-slate-800 truncate ${isEditing ? 'text-sm' : 'text-base'}`}>{task.title}</h3>
                    {isEditing && (
                         <button onClick={() => deleteTask(task.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                    )}
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  {!isEditing && (
                     <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category]}`}>
                        {task.category}
                    </span>
                  )}
                  
                  {/* Time Display/Edit */}
                  {isEditing ? (
                      <div className="flex items-center bg-slate-100 rounded-lg px-2 py-1 space-x-3">
                          <button onClick={() => updateTime(task.id, -5)} className="text-slate-400 hover:text-indigo-600 font-bold">-</button>
                          <span className="text-xs font-mono min-w-[3ch] text-center">{task.estimatedMinutes}m</span>
                          <button onClick={() => updateTime(task.id, 5)} className="text-slate-400 hover:text-indigo-600 font-bold">+</button>
                      </div>
                  ) : (
                      <span className="text-xs text-slate-400">{task.estimatedMinutes} min</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 pb-8 z-20 shadow-2xl">
        {isEditing ? (
             <div className="space-y-3 animate-in slide-in-from-bottom-5">
                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Tell AI: 'Move dinner to 7pm' or 'Group errands'"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAIUpdate()}
                    />
                    <div className="absolute left-3 top-3 text-indigo-500"><Sparkles size={16}/></div>
                 </div>
                 <button
                    onClick={handleAIUpdate}
                    disabled={!feedbackInput.trim() || isProcessingAI}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center"
                 >
                    {isProcessingAI ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    {isProcessingAI ? 'Updating Plan...' : 'Ask AI to Fix It'}
                 </button>
             </div>
        ) : (
            <button
            onClick={onStartDay}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
            <span>Start With The First Task</span>
            <ArrowRight size={20} />
            </button>
        )}
      </div>
    </div>
  );
};