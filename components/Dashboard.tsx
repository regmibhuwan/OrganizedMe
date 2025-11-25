import React from 'react';
import { UserState } from '../types';
import { Zap, Activity, Calendar } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onStartBrainDump: () => void;
  setUserEnergy: (energy: 'high' | 'medium' | 'low') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userState, onStartBrainDump, setUserEnergy }) => {
  return (
    <div className="flex-1 flex flex-col p-6 fade-in space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Good morning, {userState.name}
        </h1>
        <p className="text-slate-500">Ready to conquer the overwhelm?</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-start">
          <div className="p-2 bg-orange-100 rounded-full mb-2 text-orange-600">
            <Zap size={20} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{userState.streak}</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Day Streak</span>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-start">
          <div className="p-2 bg-blue-100 rounded-full mb-2 text-blue-600">
            <Activity size={20} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{userState.tasksCompletedToday}</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Completed</span>
        </div>
      </div>

      {/* Energy Check-in */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700">How's your energy right now?</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setUserEnergy(level)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-1 ${
                userState.energy === level
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-100 bg-white text-slate-500 hover:border-indigo-200'
              }`}
            >
              <span className="text-2xl">
                {level === 'low' ? '🔋' : level === 'medium' ? '⚡' : '🔥'}
              </span>
              <span className="text-sm font-medium capitalize">{level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-6">
        <button
          onClick={onStartBrainDump}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-slate-200 hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2"
        >
          <Calendar size={20} />
          <span>Plan My Day</span>
        </button>
        <p className="text-center text-slate-400 text-sm mt-4">
          Takes about 2 minutes
        </p>
      </div>
    </div>
  );
};
