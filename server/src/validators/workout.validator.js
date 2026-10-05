const { z } = require('zod');

const generateWorkoutRequestSchema = z.object({
  splitPreference: z.string().optional(),
  focusMuscles: z.array(z.string()).optional(),
  durationOverride: z.number().min(15).max(120).optional(),
  customNotes: z.string().max(500).optional(),
});

const updateDayStatusRequestSchema = z.object({
  status: z.enum(['pending', 'completed', 'skipped']),
});

// Zod Schema to validate structured JSON returned from Gemini
const aiExerciseSchema = z.object({
  exerciseId: z.string().optional(),
  name: z.string().min(2, 'Exercise name is required'),
  targetMuscle: z.string().default('Full Body'),
  equipment: z.string().default('Bodyweight'),
  sets: z.number().int().min(1).max(10).default(3),
  reps: z.string().default('8-12 reps'),
  restSeconds: z.number().int().min(15).max(300).default(60),
  rpeTarget: z.number().min(1).max(10).default(8),
  weightRecommendation: z.string().default('Moderate'),
  instructions: z.array(z.string()).default([]),
  tips: z.string().default(''),
});

const aiDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  dayName: z.string().min(2),
  isRestDay: z.boolean().default(false),
  targetMuscles: z.array(z.string()).default([]),
  estimatedDuration: z.number().int().min(0).max(180).default(45),
  status: z.enum(['pending', 'completed', 'skipped']).default('pending'),
  exercises: z.array(aiExerciseSchema).default([]),
});

const workoutPlanZodSchema = z.object({
  title: z.string().min(3),
  goal: z.enum(['muscle_gain', 'weight_loss', 'strength', 'endurance', 'general_fitness', 'maintenance']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().int().min(1).max(7),
  targetDurationMinutes: z.number().int().min(10).max(180),
  currentDayNumber: z.number().int().min(1).max(7).default(1),
  summary: z.string().min(10),
  schedule: z.array(aiDaySchema).min(1),
});

module.exports = {
  generateWorkoutRequestSchema,
  updateDayStatusRequestSchema,
  workoutPlanZodSchema,
};
