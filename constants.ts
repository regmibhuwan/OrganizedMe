import { TaskCategory } from "./types";

export const MOTIVATIONAL_QUOTES = [
  "Progress over perfection.",
  "You don't have to feel like it to do it.",
  "One small step is better than no steps.",
  "Action creates motivation, not the other way around.",
  "Be gentle with yourself. You're doing great.",
];

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  [TaskCategory.HOME]: "bg-orange-100 text-orange-700 border-orange-200",
  [TaskCategory.WORK]: "bg-blue-100 text-blue-700 border-blue-200",
  [TaskCategory.HEALTH]: "bg-green-100 text-green-700 border-green-200",
  [TaskCategory.ERRANDS]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [TaskCategory.SOCIAL]: "bg-purple-100 text-purple-700 border-purple-200",
  [TaskCategory.OTHER]: "bg-gray-100 text-gray-700 border-gray-200",
};

export const CATEGORY_EMOJIS: Record<TaskCategory, string> = {
  [TaskCategory.HOME]: "🏠",
  [TaskCategory.WORK]: "💼",
  [TaskCategory.HEALTH]: "🧘",
  [TaskCategory.ERRANDS]: "🛒",
  [TaskCategory.SOCIAL]: "👋",
  [TaskCategory.OTHER]: "✨",
};
