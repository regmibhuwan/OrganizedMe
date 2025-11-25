import React, { useState } from 'react';
import { Mic, Send, Loader2 } from 'lucide-react';
import { organizeBrainDump } from '../services/gemini';
import { Task } from '../types';

interface BrainDumpProps {
  onPlanCreated: (tasks: Task[], message: string) => void;
  userEnergy: string;
}

export const BrainDump: React.FC<BrainDumpProps> = ({ onPlanCreated, userEnergy }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const result = await organizeBrainDump(input, userEnergy);
      onPlanCreated(result.tasks, result.message);
    } catch (error) {
      alert("Something went wrong with the AI. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 fade-in">
      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
          🧠
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Unload Your Mind</h2>
        <p className="text-slate-600">
          Don't worry about order or details. Just dump everything you need to do here. I'll organize it for you.
        </p>

        <div className="w-full relative">
          <textarea
            className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-shadow"
            placeholder="E.g., clean room, call mom, buy milk..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
          />
          {/* Voice placeholder - simulated */}
          <button 
            className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-indigo-500 transition-colors"
            title="Voice input (simulated)"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all ${
            input.trim() && !isProcessing
              ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-[1.02]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Organizing...</span>
            </>
          ) : (
            <>
              <span>Create My Plan</span>
              <Send size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
