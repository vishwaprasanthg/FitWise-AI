import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  User,
  Heart,
  Target,
  Layers,
  Utensils,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Dumbbell
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, checkAuth } = useAuth();

  const [activeTab, setActiveTab] = useState('biometrics'); // 'biometrics' | 'fitness' | 'nutrition'
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 70,
    fitnessLevel: 'intermediate',
    primaryGoal: 'muscle_gain',
    workoutDaysPerWeek: 4,
    preferredWorkoutDuration: 45,
    equipment: ['dumbbells', 'bench'],
    preferences: {
      preferredExercises: [],
      dislikedExercises: [],
      preferredWorkoutStyle: '',
    },
    nutritionPreferences: {
      dietaryPreference: 'omnivore',
      favoriteFoods: [],
      dislikedFoods: [],
      dietaryRestrictions: [],
      cookingTimePreference: '15_30_min',
      budgetPreference: 'moderate',
    },
  });

  const [tagInputs, setTagInputs] = useState({
    preferredExercise: '',
    dislikedExercise: '',
    favoriteFood: '',
    dislikedFood: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        age: user.profile?.age || 25,
        gender: user.profile?.gender || 'male',
        height: user.profile?.height || 175,
        weight: user.profile?.weight || 70,
        fitnessLevel: user.profile?.fitnessLevel || 'intermediate',
        primaryGoal: user.profile?.primaryGoal || 'muscle_gain',
        workoutDaysPerWeek: user.profile?.workoutDaysPerWeek || 4,
        preferredWorkoutDuration: user.profile?.preferredWorkoutDuration || 45,
        equipment: user.profile?.equipment || ['dumbbells', 'bench'],
        preferences: {
          preferredExercises: user.profile?.preferences?.preferredExercises || [],
          dislikedExercises: user.profile?.preferences?.dislikedExercises || [],
          preferredWorkoutStyle: user.profile?.preferences?.preferredWorkoutStyle || '',
        },
        nutritionPreferences: {
          dietaryPreference: user.profile?.nutritionPreferences?.dietaryPreference || 'omnivore',
          favoriteFoods: user.profile?.nutritionPreferences?.favoriteFoods || [],
          dislikedFoods: user.profile?.nutritionPreferences?.dislikedFoods || [],
          dietaryRestrictions: user.profile?.nutritionPreferences?.dietaryRestrictions || [],
          cookingTimePreference: user.profile?.nutritionPreferences?.cookingTimePreference || '15_30_min',
          budgetPreference: user.profile?.nutritionPreferences?.budgetPreference || 'moderate',
        },
      });
    }
  }, [user]);

  // Compute BMI
  const heightM = (profileData.height || 175) / 100;
  const bmi = (profileData.weight / (heightM * heightM)).toFixed(1);

  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-sky-400' };
    if (val < 25) return { label: 'Healthy Weight', color: 'text-emerald-400' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiClient.put('/users/profile', {
        name: profileData.name,
        age: profileData.age,
        gender: profileData.gender,
        height: profileData.height,
        weight: profileData.weight,
        fitnessLevel: profileData.fitnessLevel,
        primaryGoal: profileData.primaryGoal,
        workoutDaysPerWeek: profileData.workoutDaysPerWeek,
        preferredWorkoutDuration: profileData.preferredWorkoutDuration,
        equipment: profileData.equipment,
      });

      if (res && res.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        await checkAuth();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to update profile' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiClient.put('/users/preferences', {
        preferences: profileData.preferences,
        nutritionPreferences: profileData.nutritionPreferences,
      });

      if (res && res.success) {
        setFeedback({ type: 'success', message: 'Preferences updated successfully!' });
        await checkAuth();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to update preferences' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (id) => {
    setProfileData((prev) => {
      let current = [...prev.equipment];
      if (id === 'no_equipment') {
        return { ...prev, equipment: ['no_equipment'] };
      }
      current = current.filter((item) => item !== 'no_equipment');
      if (current.includes(id)) {
        current = current.filter((item) => item !== id);
      } else {
        current.push(id);
      }
      if (current.length === 0) current = ['no_equipment'];
      return { ...prev, equipment: current };
    });
  };

  const addTag = (category, field, valueKey) => {
    const val = tagInputs[valueKey];
    if (!val.trim()) return;

    setProfileData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: [...(prev[category][field] || []), val.trim()],
      },
    }));

    setTagInputs((prev) => ({ ...prev, [valueKey]: '' }));
  };

  const removeTag = (category, field, item) => {
    setProfileData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: (prev[category][field] || []).filter((i) => i !== item),
      },
    }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-brand-400" />
              Fitness & Nutrition Profile
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage your biometric baseline, training gear, and nutritional guidelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeTab === 'nutrition' ? handleSavePreferences : handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2 text-xs animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-dark-850 pb-3">
          {[
            { id: 'biometrics', label: 'Biometrics & Stats', icon: Heart },
            { id: 'fitness', label: 'Fitness & Equipment', icon: Target },
            { id: 'nutrition', label: 'Nutrition & Diet', icon: Utensils },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: BIOMETRICS */}
        {activeTab === 'biometrics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-sm font-semibold text-white">General Information & Physical Measurements</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Display Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Age</label>
                  <input
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || '' })}
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Height (cm)</label>
                  <input
                    type="number"
                    value={profileData.height}
                    onChange={(e) => setProfileData({ ...profileData, height: parseFloat(e.target.value) || '' })}
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profileData.weight}
                    onChange={(e) => setProfileData({ ...profileData, weight: parseFloat(e.target.value) || '' })}
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* BMI & Stats Card */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white">Body Mass Index (BMI)</h3>
              <div className="p-4 bg-dark-950 rounded-xl border border-dark-800 text-center space-y-1">
                <div className="text-3xl font-extrabold text-white">{bmi}</div>
                <div className={`text-xs font-semibold ${getBmiCategory(parseFloat(bmi)).color}`}>
                  {getBmiCategory(parseFloat(bmi)).label}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                BMI provides a general orientation. FitPilot AI adjusts energy target and progressive overload based on body weight progression.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: FITNESS & EQUIPMENT */}
        {activeTab === 'fitness' && (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-sm font-semibold text-white">Goals, Schedule & Training Gear</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Primary Fitness Goal</label>
                <select
                  value={profileData.primaryGoal}
                  onChange={(e) => setProfileData({ ...profileData, primaryGoal: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="strength">Strength & Power</option>
                  <option value="endurance">Endurance</option>
                  <option value="general_fitness">General Fitness</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Fitness Level</label>
                <select
                  value={profileData.fitnessLevel}
                  onChange={(e) => setProfileData({ ...profileData, fitnessLevel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="beginner">Beginner (0 - 1 year)</option>
                  <option value="intermediate">Intermediate (1 - 3 years)</option>
                  <option value="advanced">Advanced (3+ years)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Weekly Workout Days ({profileData.workoutDaysPerWeek} days)</label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={profileData.workoutDaysPerWeek}
                  onChange={(e) => setProfileData({ ...profileData, workoutDaysPerWeek: parseInt(e.target.value) })}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Workout Duration ({profileData.preferredWorkoutDuration} mins)</label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={profileData.preferredWorkoutDuration}
                  onChange={(e) => setProfileData({ ...profileData, preferredWorkoutDuration: parseInt(e.target.value) })}
                  className="w-full accent-brand-500"
                />
              </div>
            </div>

            {/* Equipment Grid */}
            <div className="space-y-2 pt-4 border-t border-dark-800">
              <label className="text-xs font-semibold text-slate-300">Equipment Inventory</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'no_equipment', label: 'Bodyweight Only' },
                  { id: 'dumbbells', label: 'Dumbbells' },
                  { id: 'resistance_bands', label: 'Resistance Bands' },
                  { id: 'barbell', label: 'Barbell' },
                  { id: 'bench', label: 'Bench' },
                  { id: 'pull_up_bar', label: 'Pull-up Bar' },
                  { id: 'kettlebells', label: 'Kettlebells' },
                  { id: 'cable_machine', label: 'Cable Machine' },
                  { id: 'full_gym', label: 'Full Gym' },
                ].map((eq) => {
                  const isChecked = profileData.equipment.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipment(eq.id)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-brand-500/15 border-brand-500 text-white'
                          : 'bg-dark-950 border-dark-800 text-slate-400'
                      }`}
                    >
                      <span>{eq.label}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NUTRITION & PREFERENCES */}
        {activeTab === 'nutrition' && (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-sm font-semibold text-white">Dietary Strategy & Meal Preferences</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Diet Type</label>
                <select
                  value={profileData.nutritionPreferences.dietaryPreference}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      nutritionPreferences: {
                        ...profileData.nutritionPreferences,
                        dietaryPreference: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="omnivore">Omnivore</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Ketogenic</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Cooking Time Budget</label>
                <select
                  value={profileData.nutritionPreferences.cookingTimePreference}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      nutritionPreferences: {
                        ...profileData.nutritionPreferences,
                        cookingTimePreference: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="under_15_min">&lt; 15 mins (Quick)</option>
                  <option value="15_30_min">15 - 30 mins (Standard)</option>
                  <option value="30_60_min">30 - 60 mins (Detailed)</option>
                  <option value="meal_prep">Meal Prep Friendly</option>
                </select>
              </div>
            </div>

            {/* Favorite & Disliked Foods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dark-800">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Favorite Foods & Staples</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInputs.favoriteFood}
                    onChange={(e) => setTagInputs({ ...tagInputs, favoriteFood: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('nutritionPreferences', 'favoriteFoods', 'favoriteFood');
                      }
                    }}
                    placeholder="e.g. Eggs, Oats (Press Enter)"
                    className="flex-1 px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('nutritionPreferences', 'favoriteFoods', 'favoriteFood')}
                    className="px-3 py-2 bg-dark-850 hover:bg-dark-800 text-xs font-semibold rounded-xl text-brand-400 border border-dark-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profileData.nutritionPreferences.favoriteFoods.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag('nutritionPreferences', 'favoriteFoods', item)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Disliked Foods & Allergens</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInputs.dislikedFood}
                    onChange={(e) => setTagInputs({ ...tagInputs, dislikedFood: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('nutritionPreferences', 'dislikedFoods', 'dislikedFood');
                      }
                    }}
                    placeholder="e.g. Tofu, Dairy (Press Enter)"
                    className="flex-1 px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('nutritionPreferences', 'dislikedFoods', 'dislikedFood')}
                    className="px-3 py-2 bg-dark-850 hover:bg-dark-800 text-xs font-semibold rounded-xl text-red-400 border border-dark-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profileData.nutritionPreferences.dislikedFoods.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag('nutritionPreferences', 'dislikedFoods', item)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
