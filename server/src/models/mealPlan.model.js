const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    amount: { type: String, default: '1 serving' },
    category: { type: String, default: 'Pantry' },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'],
      required: true,
    },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
    prepTimeMinutes: { type: Number, default: 15 },
    ingredients: [ingredientSchema],
    instructions: [{ type: String }],
  },
  { _id: true }
);

const mealDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    dayName: { type: String, required: true },
    totalCalories: { type: Number, required: true },
    totalProtein: { type: Number, required: true },
    totalCarbs: { type: Number, required: true },
    totalFats: { type: Number, required: true },
    meals: [mealSchema],
  },
  { _id: true }
);

const groceryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: String, default: '' },
    checked: { type: Boolean, default: false },
  },
  { _id: false }
);

const groceryCategorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    items: [groceryItemSchema],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the meal plan'],
      trim: true,
    },
    dietaryPreference: {
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'],
      default: 'omnivore',
    },
    targetDailyCalories: {
      type: Number,
      required: true,
    },
    targetMacros: {
      proteinGrams: { type: Number, required: true },
      carbsGrams: { type: Number, required: true },
      fatsGrams: { type: Number, required: true },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    days: [mealDaySchema],
    groceryList: [groceryCategorySchema],
    aiMetadata: {
      model: { type: String, default: 'gemini-1.5-flash' },
      generatedAt: { type: Date, default: Date.now },
      customInstructions: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

mealPlanSchema.methods.toJSON = function () {
  const plan = this.toObject();
  delete plan.__v;
  return plan;
};

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;
