import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskCategory, MicroStep } from "../types";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

/**
 * Parses a raw brain dump text into structured tasks using Gemini.
 */
export const organizeBrainDump = async (
  rawText: string, 
  userEnergy: string
): Promise<{ tasks: Task[]; message: string }> => {
  
  const prompt = `
    The user feels overwhelmed. They have dumped the following list of things to do:
    "${rawText}"
    
    The user's current energy level is: ${userEnergy}.

    Please organize this list into structured tasks. 
    Rules:
    1. Estimate time (in minutes) for each. Be realistic (e.g., a shower is 15 mins, not 60; writing a report is 45 mins, not 5).
    2. Assign a category (HOME, WORK, HEALTH, ERRANDS, SOCIAL, OTHER).
    3. Check for LOGICAL DEPENDENCIES. (e.g., "Buy groceries" must happen before "Cook dinner". "Get dressed" before "Go out").
    4. Sort them logically. Usually, quick wins first build momentum, but respect dependencies.
    5. Assign an energy level required (high, medium, low).
    6. Provide a short, encouraging 1-sentence message.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, enum: Object.values(TaskCategory) },
                  estimatedMinutes: { type: Type.NUMBER },
                  energyLevel: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  priority: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["title", "category", "estimatedMinutes", "energyLevel"]
              }
            },
            message: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Enrich with IDs and status
      const tasks: Task[] = data.tasks.map((t: any) => ({
        ...t,
        id: crypto.randomUUID(),
        isCompleted: false,
        isSkipped: false
      }));
      return { tasks, message: data.message };
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("AI Error:", error);
    // Fallback if AI fails
    return {
      tasks: [
        {
          id: crypto.randomUUID(),
          title: "Take a deep breath",
          category: TaskCategory.HEALTH,
          estimatedMinutes: 2,
          isCompleted: false,
          isSkipped: false,
          priority: 'high',
          energyLevel: 'low',
          description: "Let's just center ourselves before starting."
        }
      ],
      message: "I had a little trouble connecting, but let's start with something simple."
    };
  }
};

/**
 * Re-organizes or edits the plan based on user feedback.
 */
export const updatePlanWithFeedback = async (
  currentTasks: Task[],
  feedback: string
): Promise<{ tasks: Task[]; message: string }> => {
  const prompt = `
    You are a personal organizer. 
    Current Plan (JSON): ${JSON.stringify(currentTasks.map(t => ({ title: t.title, duration: t.estimatedMinutes, category: t.category, id: t.id })))}
    
    User Feedback/Complaint: "${feedback}"

    Please modify the plan to address the user's feedback.
    - If they want to reorder, change the order.
    - If they disagree with times, update estimatedMinutes.
    - If they want to group things differently, do that.
    - Keep the IDs the same for existing tasks.
    - You can add new tasks if the feedback implies it.
    - Return the full updated list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Reuse existing ID if possible, or create new UUID for new tasks" },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING, enum: Object.values(TaskCategory) },
                  estimatedMinutes: { type: Type.NUMBER },
                  energyLevel: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  priority: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["title", "estimatedMinutes"]
              }
            },
            message: { type: Type.STRING, description: "A brief confirmation of what you changed (e.g. 'I moved dinner to the end')" }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Merge with existing state to keep local flags like isCompleted if they exist, 
      // though usually this is done before starting tasks.
      const updatedTasks: Task[] = data.tasks.map((t: any) => {
         const existing = currentTasks.find(ct => ct.id === t.id);
         return {
             ...t,
             id: t.id || crypto.randomUUID(),
             isCompleted: existing ? existing.isCompleted : false,
             isSkipped: existing ? existing.isSkipped : false,
             description: existing ? existing.description : undefined
         };
      });
      return { tasks: updatedTasks, message: data.message };
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("AI Update Error", error);
    return { tasks: currentTasks, message: "I couldn't update the plan just now. Try manual editing?" };
  }
};

/**
 * Breaks a large task into micro-steps.
 */
export const breakDownTask = async (taskTitle: string): Promise<MicroStep[]> => {
  const prompt = `
    The user is procrastinating on this task: "${taskTitle}".
    Break it down into 3-5 incredibly small, non-threatening micro-steps.
    Each step should take less than 5 minutes.
    The first step should be laughably easy (e.g., "Stand up", "Open the laptop").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  durationMinutes: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.steps.map((s: any) => ({
        id: crypto.randomUUID(),
        title: s.title,
        durationMinutes: s.durationMinutes,
        isCompleted: false
      }));
    }
    return [];
  } catch (error) {
    console.error("AI Breakdown Error", error);
    return [
      { id: '1', title: 'Just do 1 minute of it', durationMinutes: 1, isCompleted: false },
      { id: '2', title: 'See how you feel', durationMinutes: 1, isCompleted: false }
    ];
  }
};

/**
 * Generates specific coaching advice when stuck.
 */
export const getCoaching = async (taskTitle: string, emotion: string): Promise<string> => {
  const prompt = `
    User is stuck on "${taskTitle}" and feels "${emotion}".
    Act as a compassionate, non-judgmental life coach.
    Give one short paragraph (2-3 sentences) of advice to help them move just one inch forward.
    Focus on "starting" not "finishing".
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
    });
    return response.text || "You've got this. Just one small step.";
  } catch (e) {
    return "Take a deep breath. Just 10 seconds of action counts.";
  }
}