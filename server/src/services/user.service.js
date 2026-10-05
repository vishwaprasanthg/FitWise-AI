const User = require('../models/user.model');

/**
 * Get isolated user profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return user.toJSON();
};

/**
 * Save complete onboarding assessment
 */
const saveOnboarding = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  if (data.name) {
    user.name = data.name;
  }

  user.onboardingCompleted = true;
  user.profile = {
    age: data.age,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    fitnessLevel: data.fitnessLevel,
    primaryGoal: data.primaryGoal,
    workoutDaysPerWeek: data.workoutDaysPerWeek,
    preferredWorkoutDuration: data.preferredWorkoutDuration,
    equipment: data.equipment || ['no_equipment'],
    preferences: {
      preferredExercises: data.preferences?.preferredExercises || [],
      dislikedExercises: data.preferences?.dislikedExercises || [],
      preferredWorkoutStyle: data.preferences?.preferredWorkoutStyle || '',
    },
    nutritionPreferences: {
      dietaryPreference: data.nutritionPreferences?.dietaryPreference || 'omnivore',
      favoriteFoods: data.nutritionPreferences?.favoriteFoods || [],
      dislikedFoods: data.nutritionPreferences?.dislikedFoods || [],
      dietaryRestrictions: data.nutritionPreferences?.dietaryRestrictions || [],
      preferredCuisines: data.nutritionPreferences?.preferredCuisines || [],
      cookingTimePreference: data.nutritionPreferences?.cookingTimePreference || '15_30_min',
      budgetPreference: data.nutritionPreferences?.budgetPreference || 'moderate',
    },
  };

  await user.save();
  return user.toJSON();
};

/**
 * Update general profile information
 */
const updateUserProfile = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  if (data.name) user.name = data.name;

  if (!user.profile) user.profile = {};

  const profileKeys = [
    'age',
    'gender',
    'height',
    'weight',
    'fitnessLevel',
    'primaryGoal',
    'workoutDaysPerWeek',
    'preferredWorkoutDuration',
    'equipment',
  ];

  profileKeys.forEach((key) => {
    if (data[key] !== undefined) {
      user.profile[key] = data[key];
    }
  });

  await user.save();
  return user.toJSON();
};

/**
 * Update user workout and nutrition preferences
 */
const updateUserPreferences = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  if (!user.profile) user.profile = {};

  if (data.preferences) {
    user.profile.preferences = {
      ...user.profile.preferences,
      ...data.preferences,
    };
  }

  if (data.nutritionPreferences) {
    user.profile.nutritionPreferences = {
      ...user.profile.nutritionPreferences,
      ...data.nutritionPreferences,
    };
  }

  await user.save();
  return user.toJSON();
};

module.exports = {
  getUserProfile,
  saveOnboarding,
  updateUserProfile,
  updateUserPreferences,
};
