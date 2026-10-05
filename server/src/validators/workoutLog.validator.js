const { z } = require('zod');

const loggedSetZodSchema = z.object({
  setNumber: z.number().int().min(1),
  targetReps: z.string().optional(),
  actualReps: z.number().int().min(0, 'Reps cannot be negative'),
  weightKg: z.number().min(0, 'Weight cannot be negative'),
  rpe: z.number().min(1).max(10).default(8),
  completed: z.boolean().default(true),
});

const loggedExerciseZodSchema = z.object({
  exerciseId: z.string().optional(),
  name: z.string().min(2, 'Exercise name is required'),
  targetMuscle: z.string().optional(),
  equipment: z.string().optional(),
  sets: z.array(loggedSetZodSchema).min(1, 'At least one set required per exercise'),
});

const createWorkoutLogSchema = z.object({
  workoutPlanId: z.string().optional(),
  workoutDayName: z.string().min(2, 'Workout name must be at least 2 characters'),
  startTime: z.string().or(z.date()).optional(),
  endTime: z.string().or(z.date()).optional(),
  durationMinutes: z.number().min(1, 'Workout duration must be at least 1 minute'),
  exercises: z.array(loggedExerciseZodSchema).min(1, 'Workout must include at least one exercise'),
  feelingRating: z.number().int().min(1).max(5).default(4),
  notes: z.string().max(500).optional(),
});

module.exports = {
  createWorkoutLogSchema,
};
