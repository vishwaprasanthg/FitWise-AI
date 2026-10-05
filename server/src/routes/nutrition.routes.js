const express = require('express');
const {
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
} = require('../controllers/nutrition.controller');
const {
  generateMealPlanRequestSchema,
  swapMealRequestSchema,
  substituteIngredientRequestSchema,
  updateIngredientRequestSchema,
  createFoodLogSchema,
} = require('../validators/nutrition.validator');
const { validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Nutrition Targets & TDEE
router.get('/targets', getTargets);

// Meal Plans
router.post('/meal-plans/generate', validate(generateMealPlanRequestSchema), generatePlan);
router.get('/meal-plans/active', getActivePlan);
router.post('/meal-plans/swap-meal', validate(swapMealRequestSchema), swapMeal);
router.post('/substitute-ingredient', validate(substituteIngredientRequestSchema), substituteIngredient);
router.patch('/meal-plans/active/ingredient', validate(updateIngredientRequestSchema), updateIngredient);
router.get('/meal-plans', getAllPlans);
router.patch('/meal-plans/:id/active', activatePlan);

// Daily Food Tracking
router.post('/food-logs', validate(createFoodLogSchema), createFoodLog);
router.get('/food-logs', getFoodLogs);
router.delete('/food-logs/:id', deleteFoodLog);

module.exports = router;
