const { z } = require('zod');

const generateMealPlanRequestSchema = z.object({
  dietaryPreference: z.enum(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo']).optional(),
  calorieOverride: z.number().min(1000).max(5000).optional(),
  customNotes: z.string().max(500).optional(),
});

const swapMealRequestSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']),
  customNotes: z.string().max(500).optional(),
});

const substituteIngredientRequestSchema = z.object({
  ingredient: z.string().min(1, 'Ingredient name is required'),
  recipeName: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']).optional(),
  dietaryPreference: z.enum(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo']).optional(),
});

const updateIngredientRequestSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']),
  oldIngredient: z.string().min(1),
  newIngredient: z.object({
    item: z.string().min(1),
    amount: z.string().default('1 serving'),
    category: z.string().default('Pantry'),
  }),
});

const ingredientZodSchema = z.object({
  item: z.string().min(1),
  amount: z.string().default('1 serving'),
  category: z.string().default('Pantry'),
});

const mealZodSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']),
  name: z.string().min(2),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fats: z.number().min(0),
  prepTimeMinutes: z.number().min(0).default(15),
  ingredients: z.array(ingredientZodSchema).default([]),
  instructions: z.array(z.string()).default([]),
});

const mealDayZodSchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  dayName: z.string().min(2),
  totalCalories: z.number().min(0),
  totalProtein: z.number().min(0),
  totalCarbs: z.number().min(0),
  totalFats: z.number().min(0),
  meals: z.array(mealZodSchema).min(1),
});

const groceryItemZodSchema = z.object({
  name: z.string().min(1),
  amount: z.string().default(''),
  checked: z.boolean().default(false),
});

const groceryCategoryZodSchema = z.object({
  category: z.string().min(1),
  items: z.array(groceryItemZodSchema).default([]),
});

const mealPlanZodSchema = z.object({
  title: z.string().min(3),
  dietaryPreference: z.enum(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo']),
  targetDailyCalories: z.number().min(1000),
  targetMacros: z.object({
    proteinGrams: z.number().min(0),
    carbsGrams: z.number().min(0),
    fatsGrams: z.number().min(0),
  }),
  days: z.array(mealDayZodSchema).min(1),
  groceryList: z.array(groceryCategoryZodSchema).default([]),
});

const createFoodLogSchema = z.object({
  date: z.string().or(z.date()).optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().min(2, 'Food name is required'),
  calories: z.number().min(0, 'Calories cannot be negative'),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fats: z.number().min(0).default(0),
  portion: z.string().default('1 serving'),
});

module.exports = {
  generateMealPlanRequestSchema,
  swapMealRequestSchema,
  substituteIngredientRequestSchema,
  updateIngredientRequestSchema,
  mealZodSchema,
  mealPlanZodSchema,
  createFoodLogSchema,
};
