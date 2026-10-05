const User = require('../models/user.model');
const MealPlan = require('../models/mealPlan.model');
const FoodLog = require('../models/foodLog.model');
const { calculateTDEEAndMacros } = require('../utils/nutrition-calculator');
const nutritionAiService = require('./nutrition-ai.service');

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

const sortMeals = (meals = []) => {
  return [...meals].sort((a, b) => {
    const idxA = MEAL_ORDER.indexOf(a.mealType.toLowerCase());
    const idxB = MEAL_ORDER.indexOf(b.mealType.toLowerCase());
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });
};

/**
 * Re-derive categorized grocery list from plan meals
 */
const deriveGroceryList = (days = []) => {
  const categoryMap = {
    'Produce': [],
    'Meat & Seafood / Protein': [],
    'Dairy & Refrigerated': [],
    'Grains & Pantry': [],
  };

  days.forEach((day) => {
    (day.meals || []).forEach((meal) => {
      (meal.ingredients || []).forEach((ing) => {
        let cat = ing.category || 'Grains & Pantry';
        if (!categoryMap[cat]) {
          if (cat.toLowerCase().includes('meat') || cat.toLowerCase().includes('protein')) cat = 'Meat & Seafood / Protein';
          else if (cat.toLowerCase().includes('dairy')) cat = 'Dairy & Refrigerated';
          else if (cat.toLowerCase().includes('produce')) cat = 'Produce';
          else cat = 'Grains & Pantry';
        }

        const existing = categoryMap[cat].find((i) => i.name.toLowerCase() === ing.item.toLowerCase());
        if (!existing) {
          categoryMap[cat].push({
            name: ing.item,
            amount: ing.amount || '1 serving',
            checked: false,
          });
        }
      });
    });
  });

  return Object.entries(categoryMap)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({ category, items }));
};

/**
 * Get user TDEE & macro targets
 */
const getUserTargets = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return calculateTDEEAndMacros(user);
};

/**
 * Generate a new 1-day daily AI meal plan
 */
const generateMealPlan = async (userId, options = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const targets = calculateTDEEAndMacros(user, options.calorieOverride ? options.calorieOverride - calculateTDEEAndMacros(user).maintenanceCalories : 0);
  const planData = await nutritionAiService.generateMealPlanAI(user, targets, options);

  // Ensure meals are sorted in canonical order
  if (planData.days && planData.days[0]?.meals) {
    planData.days[0].meals = sortMeals(planData.days[0].meals);
  }

  // Deactivate previous meal plans
  await MealPlan.updateMany({ userId, isActive: true }, { isActive: false });

  // Save new active plan
  const newPlan = await MealPlan.create({
    userId,
    ...planData,
    isActive: true,
  });

  return newPlan.toJSON();
};

/**
 * Get active meal plan
 */
const getActiveMealPlan = async (userId) => {
  const plan = await MealPlan.findOne({ userId, isActive: true });
  if (plan && plan.days && plan.days[0]?.meals) {
    plan.days[0].meals = sortMeals(plan.days[0].meals);
  }
  return plan ? plan.toJSON() : null;
};

/**
 * Swap or customize a single meal (e.g. lunch) in the active meal plan
 */
const swapMealInActivePlan = async (userId, mealType, customNotes = '') => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const plan = await MealPlan.findOne({ userId, isActive: true });
  if (!plan || !plan.days || plan.days.length === 0) {
    const error = new Error('No active meal plan found to swap meal');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const targetDay = plan.days[0];
  const mealIndex = targetDay.meals.findIndex((m) => m.mealType.toLowerCase() === mealType.toLowerCase());

  let targetNutrients = {
    calories: Math.round(plan.targetDailyCalories * (mealType === 'snack' ? 0.10 : mealType === 'lunch' ? 0.35 : mealType === 'dinner' ? 0.30 : 0.25)),
    protein: Math.round(plan.targetMacros.proteinGrams * (mealType === 'snack' ? 0.10 : mealType === 'lunch' ? 0.35 : mealType === 'dinner' ? 0.30 : 0.25)),
    carbs: Math.round(plan.targetMacros.carbsGrams * (mealType === 'snack' ? 0.10 : mealType === 'lunch' ? 0.35 : mealType === 'dinner' ? 0.30 : 0.25)),
    fats: Math.round(plan.targetMacros.fatsGrams * (mealType === 'snack' ? 0.10 : mealType === 'lunch' ? 0.35 : mealType === 'dinner' ? 0.30 : 0.25)),
  };

  let existingMeal = null;
  if (mealIndex !== -1) {
    existingMeal = targetDay.meals[mealIndex];
    targetNutrients = {
      calories: existingMeal.calories || targetNutrients.calories,
      protein: existingMeal.protein || targetNutrients.protein,
      carbs: existingMeal.carbs || targetNutrients.carbs,
      fats: existingMeal.fats || targetNutrients.fats,
    };
  }

  // Generate modified dish via AI / Fallback
  const newMeal = await nutritionAiService.generateSingleMealAI(
    user,
    mealType,
    targetNutrients,
    existingMeal,
    { customNotes, dietaryPreference: plan.dietaryPreference }
  );

  if (mealIndex !== -1) {
    targetDay.meals[mealIndex] = newMeal;
  } else {
    targetDay.meals.push(newMeal);
  }

  // Re-sort meals in canonical order
  targetDay.meals = sortMeals(targetDay.meals);

  // Recalculate Day totals
  targetDay.totalCalories = targetDay.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  targetDay.totalProtein = targetDay.meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  targetDay.totalCarbs = targetDay.meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  targetDay.totalFats = targetDay.meals.reduce((sum, m) => sum + (m.fats || 0), 0);

  // Update grocery list
  plan.groceryList = deriveGroceryList(plan.days);
  await plan.save();

  return plan.toJSON();
};

/**
 * Get all meal plans for user
 */
const getAllMealPlans = async (userId) => {
  const plans = await MealPlan.find({ userId }).sort({ createdAt: -1 });
  return plans.map((p) => p.toJSON());
};

/**
 * Set an existing meal plan as active
 */
const setActiveMealPlan = async (userId, planId) => {
  const plan = await MealPlan.findOne({ _id: planId, userId });
  if (!plan) {
    const error = new Error('Meal plan not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  await MealPlan.updateMany({ userId }, { isActive: false });
  plan.isActive = true;
  await plan.save();

  return plan.toJSON();
};

/**
 * Log food item (retained for backend consistency)
 */
const logFood = async (userId, foodData) => {
  const newLog = await FoodLog.create({
    userId,
    ...foodData,
    date: foodData.date ? new Date(foodData.date) : new Date(),
  });
  return newLog.toJSON();
};

/**
 * Get food logs for date + macro summary
 */
const getDailyFoodLogs = async (userId, dateStr) => {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const logs = await FoodLog.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ createdAt: 1 });

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fats: acc.fats + (log.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const user = await User.findById(userId);
  const targets = user ? calculateTDEEAndMacros(user) : null;

  return {
    date: startOfDay.toISOString(),
    logs: logs.map((l) => l.toJSON()),
    totals,
    targets,
  };
};

/**
 * Delete a food log entry
 */
const deleteFoodLog = async (userId, logId) => {
  const log = await FoodLog.findOneAndDelete({ _id: logId, userId });
  if (!log) {
    const error = new Error('Food log entry not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return { success: true, message: 'Food log deleted successfully' };
};

module.exports = {
  getUserTargets,
  generateMealPlan,
  getActiveMealPlan,
  swapMealInActivePlan,
  getAllMealPlans,
  setActiveMealPlan,
  logFood,
  getDailyFoodLogs,
  deleteFoodLog,
};
