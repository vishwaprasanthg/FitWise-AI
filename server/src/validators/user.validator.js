const { z } = require('zod');

const basicMetricsSchema = z.object({
  age: z.number().int().min(13, 'Age must be at least 13').max(120, 'Age must be under 120').optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  height: z.number().positive('Height must be greater than 0').max(300, 'Invalid height in cm').optional(),
  weight: z.number().positive('Weight must be greater than 0').max(500, 'Invalid weight in kg').optional(),
});

const fitnessSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  primaryGoal: z.enum([
    'weight_loss',
    'muscle_gain',
    'strength',
    'endurance',
    'general_fitness',
    'maintenance',
  ]).optional(),
  workoutDaysPerWeek: z.number().int().min(1, 'At least 1 day per week').max(7, 'Maximum 7 days per week').optional(),
  preferredWorkoutDuration: z.number().int().min(10, 'Minimum 10 minutes').max(180, 'Maximum 180 minutes').optional(),
  equipment: z.array(z.string()).optional(),
  preferredDays: z.array(z.string()).optional(),
  intensity: z.enum(['low', 'moderate', 'high']).optional(),
});

const workoutPreferencesSchema = z.object({
  preferredExercises: z.array(z.string()).optional(),
  dislikedExercises: z.array(z.string()).optional(),
  preferredWorkoutStyle: z.string().optional(),
});

const nutritionPreferencesSchema = z.object({
  dietaryPreference: z.string().optional(),
  favoriteFoods: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  cookingTimePreference: z.string().optional(),
  budgetPreference: z.string().optional(),
});

// Full onboarding schema
const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  age: z.number().int().min(13).max(120),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  height: z.number().positive().max(300),
  weight: z.number().positive().max(500),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  primaryGoal: z.enum([
    'weight_loss',
    'muscle_gain',
    'strength',
    'endurance',
    'general_fitness',
    'maintenance',
  ]),
  workoutDaysPerWeek: z.number().int().min(1).max(7),
  preferredWorkoutDuration: z.number().int().min(10).max(180),
  equipment: z.array(z.string()).min(1, 'Please select at least one equipment option (or Bodyweight)'),
  preferences: workoutPreferencesSchema.optional(),
  nutritionPreferences: nutritionPreferencesSchema.optional(),
});

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(500).optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  primaryGoal: z.enum([
    'weight_loss',
    'muscle_gain',
    'strength',
    'endurance',
    'general_fitness',
    'maintenance',
  ]).optional(),
  workoutDaysPerWeek: z.number().int().min(1).max(7).optional(),
  preferredWorkoutDuration: z.number().int().min(10).max(180).optional(),
  equipment: z.array(z.string()).optional(),
});

// Preferences update schema
const preferencesUpdateSchema = z.object({
  preferences: workoutPreferencesSchema.optional(),
  nutritionPreferences: nutritionPreferencesSchema.optional(),
});

module.exports = {
  onboardingSchema,
  profileUpdateSchema,
  preferencesUpdateSchema,
};
