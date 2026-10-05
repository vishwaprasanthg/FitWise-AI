import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  Utensils,
  Sparkles,
  Flame,
  Clock,
  ShoppingCart,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  X,
  Shuffle,
  Leaf
} from 'lucide-react';

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

const DIET_BADGES = {
  vegetarian: { label: 'Vegetarian', icon: '🌿', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  vegan: { label: '100% Vegan', icon: '🌱', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  pescatarian: { label: 'Pescatarian', icon: '🐟', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  omnivore: { label: 'Omnivore', icon: '🥩', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
  keto: { label: 'Ketogenic', icon: '🥑', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  paleo: { label: 'Paleo', icon: '🍖', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
};

export const MealPlanPage = () => {
  const { user } = useAuth();

  const [activePlan, setActivePlan] = useState(null);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [swappingMealType, setSwappingMealType] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Expand recipe accordion map
  const [expandedMeals, setExpandedMeals] = useState({ 0: true, 1: true, 2: true, 3: true });

  // Generate Daily Plan modal state
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    dietaryPreference: user?.profile?.nutritionPreferences?.dietaryPreference || 'omnivore',
    calorieOverride: undefined,
    customNotes: '',
  });

  const fetchNutritionData = async () => {
    setLoading(true);
    setError('');
    try {
      const [targetRes, activeRes] = await Promise.all([
        apiClient.get('/nutrition/targets'),
        apiClient.get('/nutrition/meal-plans/active'),
      ]);

      if (targetRes && targetRes.success && targetRes.data?.targets) {
        setTargets(targetRes.data.targets);
      }
      if (activeRes && activeRes.success && activeRes.data?.plan) {
        setActivePlan(activeRes.data.plan);
        if (activeRes.data.plan.dietaryPreference) {
          setGenerateOptions((prev) => ({
            ...prev,
            dietaryPreference: activeRes.data.plan.dietaryPreference,
          }));
        }
      } else {
        setActivePlan(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load daily meal planning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const handleGenerateDailyPlan = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccessMessage('');
    try {
      const payload = {
        dietaryPreference: generateOptions.dietaryPreference,
        calorieOverride: generateOptions.calorieOverride ? parseInt(generateOptions.calorieOverride) : undefined,
        customNotes: generateOptions.customNotes,
      };

      const res = await apiClient.post('/nutrition/meal-plans/generate', payload);
      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        setGenerateModalOpen(false);
        const dietLabel = DIET_BADGES[generateOptions.dietaryPreference]?.label || generateOptions.dietaryPreference;
        setSuccessMessage(`Fresh ${dietLabel} Daily Blueprint generated successfully!`);
        setTimeout(() => setSuccessMessage(''), 4500);
      } else {
        setError(res.message || 'Unable to generate daily meal plan');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during AI meal plan generation');
    } finally {
      setGenerating(false);
    }
  };

  // Instant 1-Click Swap Entire Dish
  const handleInstantSwapMeal = async (meal) => {
    setSwappingMealType(meal.mealType);
    setError('');
    try {
      const res = await apiClient.post('/nutrition/meal-plans/swap-meal', {
        mealType: meal.mealType,
      });

      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        const mealLabel = meal.mealType === 'snack' ? 'Snacks' : meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);
        const newMeal = res.data.plan.days?.[0]?.meals?.find((m) => m.mealType === meal.mealType);
        setSuccessMessage(`Swapped ${mealLabel} dish: "${newMeal?.name || 'New Recipe'}"!`);
        setTimeout(() => setSuccessMessage(''), 4500);
      } else {
        setError(res.message || 'Failed to swap meal dish');
      }
    } catch (err) {
      setError(err.message || 'Failed to swap dish');
    } finally {
      setSwappingMealType(null);
    }
  };

  const toggleExpandMeal = (idx) => {
    setExpandedMeals((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentDay = activePlan?.days?.[0] || null;
  // Strict canonical sorting: Breakfast, Lunch, Snacks, Dinner
  const rawMeals = currentDay?.meals || [];
  const sortedMeals = [...rawMeals].sort(
    (a, b) => MEAL_ORDER.indexOf(a.mealType.toLowerCase()) - MEAL_ORDER.indexOf(b.mealType.toLowerCase())
  );

  const activeDiet = activePlan?.dietaryPreference || user?.profile?.nutritionPreferences?.dietaryPreference || 'omnivore';
  const dietBadge = DIET_BADGES[activeDiet] || DIET_BADGES.omnivore;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
              <Utensils className="w-3.5 h-3.5" />
              <span>AI Daily Nutrition & Meal Planner</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activePlan ? activePlan.title : 'Daily Nutrition Blueprint'}
              </h1>
              {activePlan && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${dietBadge.color}`}>
                  <span>{dietBadge.icon}</span>
                  <span>{dietBadge.label}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-silver-400 mt-1">
              Calibrated to your {user?.profile?.primaryGoal?.replace('_', ' ')} goals with calorie & macro breakdowns for Breakfast, Lunch, Snacks, and Dinner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/nutrition/grocery"
              className="px-4 py-2.5 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-white rounded-xl text-xs font-bold shadow-silver-sm transition flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-brand-400" />
              <span>Smart Grocery List</span>
            </Link>

            <button
              onClick={() => setGenerateModalOpen(true)}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Daily Plan</span>
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-xs text-brand-300 flex items-center space-x-3 shadow-silver-sm animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-xs text-brand-300 flex items-start space-x-3 shadow-silver-sm">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* DAILY TDEE & MACRO TARGETS BAR */}
        {targets && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 card-silver space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-dark-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                  Science-Based Caloric Calibration (Mifflin-St Jeor)
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">Daily Energy & Macro Distribution</h3>
              </div>
              <div className="text-xs text-silver-400">
                Maintenance: <strong className="text-white">{targets.maintenanceCalories} kcal</strong> &bull; Target:{' '}
                <strong className="text-brand-400">{targets.targetDailyCalories} kcal</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 text-center space-y-1 shadow-silver-sm">
                <div className="text-[10px] text-silver-400 font-bold uppercase">Daily Calories</div>
                <div className="text-xl font-black text-white">{currentDay?.totalCalories || targets.targetDailyCalories}</div>
                <div className="text-[10px] text-silver-500">kcal / day</div>
              </div>

              <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 text-center space-y-1 shadow-silver-sm">
                <div className="text-[10px] text-silver-400 font-bold uppercase">Protein Target</div>
                <div className="text-xl font-black text-brand-400">{currentDay?.totalProtein || targets.targetMacros?.proteinGrams}g</div>
                <div className="text-[10px] text-silver-500">{targets.percentages?.protein}% energy</div>
              </div>

              <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 text-center space-y-1 shadow-silver-sm">
                <div className="text-[10px] text-silver-400 font-bold uppercase">Carbs Target</div>
                <div className="text-xl font-black text-white">{currentDay?.totalCarbs || targets.targetMacros?.carbsGrams}g</div>
                <div className="text-[10px] text-silver-500">{targets.percentages?.carbs}% energy</div>
              </div>

              <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 text-center space-y-1 shadow-silver-sm">
                <div className="text-[10px] text-silver-400 font-bold uppercase">Fats Target</div>
                <div className="text-xl font-black text-white">{currentDay?.totalFats || targets.targetMacros?.fatsGrams}g</div>
                <div className="text-[10px] text-silver-500">{targets.percentages?.fats}% energy</div>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-3xl card-silver">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-silver-400 font-medium">Retrieving your personalized daily nutrition plan...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !activePlan && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-10 text-center space-y-5 max-w-xl mx-auto card-silver">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto shadow-red-sm">
              <Utensils className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">No Active Meal Plan Yet</h2>
              <p className="text-xs text-silver-400 leading-relaxed">
                FitPilot AI is ready to structure a personalized daily nutrition blueprint matching your dietary lifestyle ({dietBadge.label}), favorite staples, and exact TDEE targets.
              </p>
            </div>
            <button
              onClick={() => setGenerateModalOpen(true)}
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Daily Meal Plan</span>
            </button>
          </div>
        )}

        {/* ACTIVE DAILY MEAL PLAN (Strict Order: Breakfast, Lunch, Snacks, Dinner) */}
        {!loading && activePlan && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedMeals.map((meal, mIdx) => {
                const isExpanded = expandedMeals[mIdx];
                const isSwapping = swappingMealType === meal.mealType;
                const mealLabel = meal.mealType === 'snack' ? 'Snacks' : meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);

                return (
                  <div
                    key={meal._id || mIdx}
                    className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-7 card-silver space-y-5 transition relative flex flex-col justify-between"
                  >
                    {isSwapping && (
                      <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-xs rounded-3xl z-10 flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
                        <span className="text-xs font-bold text-white">Generating new {mealLabel} recipe...</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Meal Header & Swap Dish Button */}
                      <div className="flex items-start justify-between gap-3 border-b border-dark-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold uppercase">
                              {mealLabel}
                            </span>
                            <span className="text-[10px] text-silver-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-silver-400" />
                              <span>{meal.prepTimeMinutes} mins</span>
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-white tracking-tight mt-1.5">
                            {meal.name}
                          </h3>
                        </div>

                        {/* Direct Swap Entire Dish Button */}
                        <button
                          disabled={isSwapping}
                          onClick={() => handleInstantSwapMeal(meal)}
                          className="px-3.5 py-2 bg-dark-850 hover:bg-dark-800 active:bg-brand-500/20 border border-dark-800 hover:border-brand-500/40 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-silver-sm"
                          title="Swap this dish for another recipe"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-brand-400" />
                          <span>Swap Dish</span>
                        </button>
                      </div>

                      {/* Calorie & Macro Pills */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-dark-950 p-2.5 rounded-xl border border-dark-800 shadow-silver-sm">
                          <div className="text-[9px] text-silver-400 uppercase font-bold">Calories</div>
                          <div className="text-sm font-black text-white">{meal.calories}</div>
                          <div className="text-[9px] text-silver-500">kcal</div>
                        </div>
                        <div className="bg-dark-950 p-2.5 rounded-xl border border-dark-800 shadow-silver-sm">
                          <div className="text-[9px] text-silver-400 uppercase font-bold">Protein</div>
                          <div className="text-sm font-black text-brand-400">{meal.protein}g</div>
                          <div className="text-[9px] text-silver-500">protein</div>
                        </div>
                        <div className="bg-dark-950 p-2.5 rounded-xl border border-dark-800 shadow-silver-sm">
                          <div className="text-[9px] text-silver-400 uppercase font-bold">Carbs</div>
                          <div className="text-sm font-black text-white">{meal.carbs}g</div>
                          <div className="text-[9px] text-silver-500">carbs</div>
                        </div>
                        <div className="bg-dark-950 p-2.5 rounded-xl border border-dark-800 shadow-silver-sm">
                          <div className="text-[9px] text-silver-400 uppercase font-bold">Fats</div>
                          <div className="text-sm font-black text-white">{meal.fats}g</div>
                          <div className="text-[9px] text-silver-500">fat</div>
                        </div>
                      </div>

                      {/* Ingredients & Recipe Accordion */}
                      <div className="pt-1">
                        <button
                          onClick={() => toggleExpandMeal(mIdx)}
                          className="w-full flex items-center justify-between text-xs text-silver-400 hover:text-white transition font-semibold"
                        >
                          <span>{isExpanded ? 'Hide Recipe Details' : 'View Recipe & Ingredients'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-400" /> : <ChevronDown className="w-4 h-4 text-brand-400" />}
                        </button>

                        {isExpanded && (
                          <div className="pt-4 space-y-4 text-xs animate-fadeIn">
                            {/* Ingredients List */}
                            {meal.ingredients?.length > 0 && (
                              <div className="space-y-2">
                                <div className="font-bold text-white text-[11px] uppercase tracking-wider">
                                  Ingredients:
                                </div>
                                <div className="space-y-1">
                                  {meal.ingredients.map((ing, iIdx) => (
                                    <div
                                      key={iIdx}
                                      className="p-2.5 bg-dark-950 rounded-xl border border-dark-800 flex items-center justify-between gap-2 shadow-silver-sm"
                                    >
                                      <span className="font-bold text-white">{ing.item}</span>
                                      <span className="text-[11px] text-silver-400 font-mono">({ing.amount})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Cooking Instructions */}
                            {meal.instructions?.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-dark-800">
                                <div className="font-bold text-white text-[11px] uppercase tracking-wider">
                                  Preparation Steps:
                                </div>
                                <ol className="space-y-1.5 text-silver-300 text-[11px]">
                                  {meal.instructions.map((step, sIdx) => (
                                    <li key={sIdx} className="flex items-start space-x-2">
                                      <span className="w-4 h-4 rounded-full bg-dark-950 border border-dark-800 text-brand-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {sIdx + 1}
                                      </span>
                                      <span className="leading-relaxed">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GENERATE NEW DAILY PLAN MODAL */}
        {generateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative card-silver">
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-silver-400 hover:text-white rounded-full hover:bg-dark-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini Nutrition Engine</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Generate Daily AI Meal Plan</h3>
                <p className="text-xs text-silver-400">
                  FitPilot AI will structure recipes for Breakfast, Lunch, Snacks, and Dinner strictly matching your selected dietary lifestyle.
                </p>
              </div>

              <form onSubmit={handleGenerateDailyPlan} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">Dietary Lifestyle</label>
                  <select
                    value={generateOptions.dietaryPreference}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, dietaryPreference: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="vegetarian">🌿 Vegetarian (Plant-based, Dairy, Eggs, Tofu, Legumes)</option>
                    <option value="vegan">🌱 Vegan (100% Plant-based, No Animal Products)</option>
                    <option value="pescatarian">🐟 Pescatarian (Fish, Seafood, Vegetarian)</option>
                    <option value="omnivore">🥩 Omnivore (Balanced Whole Foods, Meats, Poultry, Fish)</option>
                    <option value="keto">🥑 Ketogenic (Low Carb, High Healthy Fat)</option>
                    <option value="paleo">🍖 Paleo (Whole Unprocessed Foods)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">
                    Calorie Target Override (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder={`Default: ${targets?.targetDailyCalories || 2400} kcal`}
                    value={generateOptions.calorieOverride || ''}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, calorieOverride: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-silver-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">
                    Special Chef Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={generateOptions.customNotes}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, customNotes: e.target.value })}
                    placeholder="e.g. Include quick 10-minute breakfasts, high-protein overnight oats, rich spice variety..."
                    className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-silver-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center justify-center space-x-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>FitPilot AI is Designing Your Daily Meal Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Daily Meal Plan</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
