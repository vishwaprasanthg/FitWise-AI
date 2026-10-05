/**
 * Scientific Caloric & Macronutrient Calculator
 * Uses the Mifflin-St Jeor equation for BMR, adjusted for training frequency and goals.
 */

const calculateTDEEAndMacros = (user, customGoalOffset = 0) => {
  const profile = user.profile || {};
  const weightKg = profile.weight || 70;
  const heightCm = profile.height || 175;
  const age = profile.age || 25;
  const gender = (profile.gender || 'male').toLowerCase();
  const workoutDays = profile.workoutDaysPerWeek || 4;
  const goal = profile.primaryGoal || 'muscle_gain';

  // 1. Basal Metabolic Rate (BMR) - Mifflin-St Jeor
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  // 2. Activity Multiplier based on weekly training frequency
  let activityMultiplier = 1.375; // Light (1-2 days)
  if (workoutDays >= 5) {
    activityMultiplier = 1.725; // Very Active (5-7 days)
  } else if (workoutDays >= 3) {
    activityMultiplier = 1.55; // Moderately Active (3-4 days)
  }

  const maintenanceCalories = Math.round(bmr * activityMultiplier);

  // 3. Goal Caloric Adjustment
  let goalAdjustment = 0;
  if (customGoalOffset !== 0) {
    goalAdjustment = customGoalOffset;
  } else {
    switch (goal) {
      case 'muscle_gain':
        goalAdjustment = 350; // Lean surplus
        break;
      case 'weight_loss':
        goalAdjustment = -450; // Sustainable deficit
        break;
      case 'strength':
        goalAdjustment = 200; // Slight surplus for recovery
        break;
      case 'endurance':
        goalAdjustment = 150;
        break;
      case 'maintenance':
      case 'general_fitness':
      default:
        goalAdjustment = 0;
        break;
    }
  }

  const targetDailyCalories = Math.max(1200, maintenanceCalories + goalAdjustment);

  // 4. Macronutrient Distribution
  // Protein: 2.0g to 2.2g per kg bodyweight
  let proteinPerKg = 2.0;
  if (goal === 'weight_loss') proteinPerKg = 2.2; // Higher protein to preserve lean body mass in deficit
  if (goal === 'muscle_gain') proteinPerKg = 2.1;

  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Fat: 25% - 30% of total calories (9 kcal/g)
  const fatCalories = targetDailyCalories * 0.25;
  const fatsGrams = Math.round(fatCalories / 9);

  // Carbs: Remainder of daily calories (4 kcal/g)
  const remainingCaloriesForCarbs = Math.max(0, targetDailyCalories - (proteinCalories + fatsGrams * 9));
  const carbsGrams = Math.round(remainingCaloriesForCarbs / 4);

  return {
    bmr: Math.round(bmr),
    maintenanceCalories,
    targetDailyCalories,
    goalAdjustment,
    targetMacros: {
      proteinGrams,
      carbsGrams,
      fatsGrams,
    },
    percentages: {
      protein: Math.round(((proteinGrams * 4) / targetDailyCalories) * 100),
      fats: Math.round(((fatsGrams * 9) / targetDailyCalories) * 100),
      carbs: Math.round(((carbsGrams * 4) / targetDailyCalories) * 100),
    },
  };
};

module.exports = {
  calculateTDEEAndMacros,
};
