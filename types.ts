export enum AppView {
  DASHBOARD = 'DASHBOARD',
  BRAIN_DUMP = 'BRAIN_DUMP',
  PLAN_REVIEW = 'PLAN_REVIEW',
  FOCUS_MODE = 'FOCUS_MODE',
  CELEBRATION = 'CELEBRATION',
}

export enum TaskCategory {
  HOME = 'HOME',
  WORK = 'WORK',
  HEALTH = 'HEALTH',
  ERRANDS = 'ERRANDS',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER',
}

export interface MicroStep {
  id: string;
  title: string;
  isCompleted: boolean;
  durationMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  estimatedMinutes: number;
  isCompleted: boolean;
  isSkipped: boolean;
  microSteps?: MicroStep[];
  priority: 'high' | 'medium' | 'low';
  energyLevel: 'high' | 'medium' | 'low';
}

export interface UserState {
  name: string;
  energy: 'high' | 'medium' | 'low';
  streak: number;
  tasksCompletedToday: number;
}

export interface AIResponse {
  tasks: Task[];
  motivationalMessage: string;
}
