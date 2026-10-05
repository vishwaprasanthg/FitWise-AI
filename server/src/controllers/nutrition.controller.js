const nutritionService = require('../services/nutrition.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get scientific TDEE and macronutrient targets
 * @route   GET /api/nutrition/targets
 * @access  Private
 */
const getTargets = async (req, res, next) => {
  try {
    const targets = await nutritionService.getUserTargets(req.user.id);
    return successResponse(res, { targets }, 'Nutrition targets calculated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate personalized 1-day daily AI meal plan
 * @route   POST /api/nutrition/meal-plans/generate
 * @access  Private
 */
const generatePlan = async (req, res, next) => {
  try {
    const plan = await nutritionService.generateMealPlan(req.user.id, req.body);
    return successResponse(res, { plan }, 'Daily AI meal plan generated and activated successfully!', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active meal plan with grocery list
 * @route   GET /api/nutrition/meal-plans/active
 * @access  Private
 */
const getActivePlan = async (req, res, next) => {
  try {
    const plan = await nutritionService.getActiveMealPlan(req.user.id);
    return successResponse(res, { plan }, 'Active meal plan retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Swap a single meal (e.g. Lunch) with a newly generated AI dish
 * @route   POST /api/nutrition/meal-plans/swap-meal
 * @access  Private
 */
const swapMeal = async (req, res, next) => {
  try {
    const { mealType, customNotes } = req.body;
    const plan = await nutritionService.swapMealInActivePlan(req.user.id, mealType, customNotes);
    return successResponse(res, { plan }, `${mealType} dish swapped successfully!`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI ingredient substitutions
 * @route   POST /api/nutrition/substitute-ingredient
 * @access  Private
 */
const substituteIngredient = async (req, res, next) => {
  try {
    const { ingredient, recipeName, mealType, dietaryPreference } = req.body;
    const result = await nutritionService.getIngredientSubstitutes(
      req.user.id,
      ingredient,
      recipeName,
      mealType,
      dietaryPreference
    );
    return successResponse(res, result, 'Ingredient substitutions retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a specific ingredient in the active plan
 * @route   PATCH /api/nutrition/meal-plans/active/ingredient
 * @access  Private
 */
const updateIngredient = async (req, res, next) => {
  try {
    const { mealType, oldIngredient, newIngredient } = req.body;
    const plan = await nutritionService.updatePlanIngredient(
      req.user.id,
      mealType,
      oldIngredient,
      newIngredient
    );
    return successResponse(res, { plan }, 'Recipe ingredient updated successfully!', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all meal plans for user
 * @route   GET /api/nutrition/meal-plans
 * @access  Private
 */
const getAllPlans = async (req, res, next) => {
  try {
    const plans = await nutritionService.getAllMealPlans(req.user.id);
    return successResponse(res, { plans }, 'Meal plans retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set a specific meal plan as active
 * @route   PATCH /api/nutrition/meal-plans/:id/active
 * @access  Private
 */
const activatePlan = async (req, res, next) => {
  try {
    const plan = await nutritionService.setActiveMealPlan(req.user.id, req.params.id);
    return successResponse(res, { plan }, 'Meal plan activated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log a meal / food item (retained for backwards compatibility)
 * @route   POST /api/nutrition/food-logs
 * @access  Private
 */
const createFoodLog = async (req, res, next) => {
  try {
    const log = await nutritionService.logFood(req.user.id, req.body);
    return successResponse(res, { log }, 'Food logged successfully!', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get daily food logs and macro progress
 * @route   GET /api/nutrition/food-logs
 * @access  Private
 */
const getFoodLogs = async (req, res, next) => {
  try {
    const data = await nutritionService.getDailyFoodLogs(req.user.id, req.query.date);
    return successResponse(res, data, 'Daily food logs retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete food log entry
 * @route   DELETE /api/nutrition/food-logs/:id
 * @access  Private
 */
const deleteFoodLog = async (req, res, next) => {
  try {
    const result = await nutritionService.deleteFoodLog(req.user.id, req.params.id);
    return successResponse(res, result, 'Food log entry deleted', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTargets,
  generatePlan,
  getActivePlan,
  swapMeal,
  substituteIngredient,
  updateIngredient,
  getAllPlans,
  activatePlan,
  createFoodLog,
  getFoodLogs,
  deleteFoodLog,
};
