import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  Dumbbell,
  Target,
  Calendar,
  Layers,
  Heart,
  Utensils,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  Zap,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';

export const OnboardingWizard = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.profile?.age || 25,
    gender: user?.profile?.gender || 'male',
    height: user?.profile?.height || 175,
    weight: user?.profile?.weight || 70,
    fitnessLevel: user?.profile?.fitnessLevel || 'intermediate',
    primaryGoal: user?.profile?.primaryGoal || 'muscle_gain',
    workoutDaysPerWeek: user?.profile?.workoutDaysPerWeek || 4,
    preferredWorkoutDuration: user?.profile?.preferredWorkoutDuration || 45,
    equipment: user?.profile?.equipment?.length ? user?.profile.equipment : ['dumbbells', 'bench'],
    preferences: {
      preferredExercises: user?.profile?.preferences?.preferredExercises || ['Bench Press', 'Pull-ups', 'Squats'],
      dislikedExercises: user?.profile?.preferences?.dislikedExercises || ['Burpees'],
      preferredWorkoutStyle: user?.profile?.preferences?.preferredWorkoutStyle || 'Hypertrophy / Strength',
    },
    nutritionPreferences: {
      dietaryPreference: user?.profile?.nutritionPreferences?.dietaryPreference || 'omnivore',
      favoriteFoods: user?.profile?.nutritionPreferences?.favoriteFoods || ['Eggs', 'Chicken', 'Oats', 'Rice'],
      dislikedFoods: user?.profile?.nutritionPreferences?.dislikedFoods || ['Tofu'],
      dietaryRestrictions: user?.profile?.nutritionPreferences?.dietaryRestrictions || [],
      cookingTimePreference: user?.profile?.nutritionPreferences?.cookingTimePreference || '15_30_min',
      budgetPreference: user?.profile?.nutritionPreferences?.budgetPreference || 'moderate',
    },
  });

  // Helper inputs for tags
  const [exerciseInput, setExerciseInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [favFoodInput, setFavFoodInput] = useState('');
  const [dislikeFoodInput, setDislikeFoodInput] = useState('');

  // Available equipment catalog
  const equipmentCatalog = [
    { id: 'no_equipment', label: 'Bodyweight Only (No Equipment)', icon: '🏃' },
    { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
    { id: 'resistance_bands', label: 'Resistance Bands', icon: '🎗️' },
    { id: 'barbell', label: 'Barbell & Weight Plates', icon: '🏋️‍♂️' },
    { id: 'bench', label: 'Workout Bench', icon: '🪑' },
    { id: 'pull_up_bar', label: 'Pull-up Bar', icon: '🧗' },
    { id: 'kettlebells', label: 'Kettlebells', icon: '🔔' },
    { id: 'cable_machine', label: 'Cable Machine', icon: '⚙️' },
    { id: 'full_gym', label: 'Full Commercial Gym Access', icon: '🏢' },
  ];

  const goals = [
    { id: 'muscle_gain', title: 'Muscle Gain & Hypertrophy', desc: 'Build lean muscle mass and improve physical physique', icon: Flame },
    { id: 'weight_loss', title: 'Fat Loss & Toning', desc: 'Burn calories, shed excess body fat, and increase metabolic rate', icon: Zap },
    { id: 'strength', title: 'Strength & Power', desc: 'Increase 1-rep maximums on foundational compound movements', icon: Dumbbell },
    { id: 'endurance', title: 'Stamina & Endurance', desc: 'Improve cardiovascular capacity, aerobic fitness, and energy', icon: Heart },
    { id: 'general_fitness', title: 'General Fitness & Health', desc: 'Stay active, functional, mobile, and energized day-to-day', icon: Sparkles },
    { id: 'maintenance', title: 'Maintenance & Longevity', desc: 'Maintain current body composition and improve joint health', icon: Shield },
  ];

  const toggleEquipment = (id) => {
    setFormData((prev) => {
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

  const handleNext = () => {
    setError('');
    // Step validation
    if (step === 1) {
      if (!formData.age || formData.age < 13 || formData.age > 120) {
        setError('Please enter a valid age between 13 and 120.');
        return;
      }
      if (!formData.height || formData.height < 50 || formData.height > 300) {
        setError('Please enter a valid height in cm (e.g. 175).');
        return;
      }
      if (!formData.weight || formData.weight < 20 || formData.weight > 500) {
        setError('Please enter a valid weight in kg (e.g. 70).');
        return;
      }
    }
    if (step === 4 && (!formData.equipment || formData.equipment.length === 0)) {
      setError('Please select at least one equipment option (or Bodyweight).');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post('/users/onboarding', formData);
      if (res && res.success) {
        await checkAuth(); // Refresh user state in AuthContext
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Failed to save onboarding assessment.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during onboarding submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = (field, value, setter) => {
    if (!value.trim()) return;
    setFormData((prev) => {
      const isPref = field.startsWith('pref_');
      const isNutri = field.startsWith('nutri_');
      const cleanField = field.replace('pref_', '').replace('nutri_', '');

      if (isPref) {
        const list = prev.preferences[cleanField] || [];
        if (!list.includes(value.trim())) {
          return {
            ...prev,
            preferences: { ...prev.preferences, [cleanField]: [...list, value.trim()] },
          };
        }
      } else if (isNutri) {
        const list = prev.nutritionPreferences[cleanField] || [];
        if (!list.includes(value.trim())) {
          return {
            ...prev,
            nutritionPreferences: { ...prev.nutritionPreferences, [cleanField]: [...list, value.trim()] },
          };
        }
      }
      return prev;
    });
    setter('');
  };

  const removeTag = (field, item) => {
    setFormData((prev) => {
      const isPref = field.startsWith('pref_');
      const isNutri = field.startsWith('nutri_');
      const cleanField = field.replace('pref_', '').replace('nutri_', '');

      if (isPref) {
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            [cleanField]: (prev.preferences[cleanField] || []).filter((i) => i !== item),
          },
        };
      } else if (isNutri) {
        return {
          ...prev,
          nutritionPreferences: {
            ...prev.nutritionPreferences,
            [cleanField]: (prev.nutritionPreferences[cleanField] || []).filter((i) => i !== item),
          },
        };
      }
      return prev;
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2 text-brand-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              FitPilot Assessment
            </span>
            <span>Step {step} of {totalSteps}</span>
          </div>

          <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden border border-dark-800">
            <div
              className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 relative">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: BIOMETRICS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brand-400" />
                  Your Biometric Baseline
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  These metrics allow FitPilot AI to calculate appropriate training volume, energy expenditure, and baseline metrics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Age (years)</label>
                  <input
                    type="number"
                    min="13"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || '' })}
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Non-Binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Height (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || '' })}
                    placeholder="e.g. 178"
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Weight (kg)</label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || '' })}
                    placeholder="e.g. 74.5"
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GOAL & FITNESS LEVEL */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-400" />
                  Primary Goal & Current Level
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose what you want to achieve. FitPilot AI tunes progression and workout intensity based on your selection.
                </p>
              </div>

              {/* Goal Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Select Primary Fitness Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map((g) => {
                    const Icon = g.icon;
                    const isSelected = formData.primaryGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryGoal: g.id })}
                        className={`text-left p-4 rounded-xl border transition flex items-start space-x-3 ${
                          isSelected
                            ? 'bg-brand-500/15 border-brand-500 text-white shadow-md shadow-brand-500/10'
                            : 'bg-dark-950/70 border-dark-800 hover:border-dark-700 text-slate-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-brand-500 text-white' : 'bg-dark-850 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{g.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{g.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fitness Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Current Fitness Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'beginner', label: 'Beginner', desc: '0 - 1 year consistent training' },
                    { id: 'intermediate', label: 'Intermediate', desc: '1 - 3 years consistent training' },
                    { id: 'advanced', label: 'Advanced', desc: '3+ years structured lifting' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, fitnessLevel: lvl.id })}
                      className={`p-3.5 rounded-xl border text-center transition ${
                        formData.fitnessLevel === lvl.id
                          ? 'bg-brand-500/15 border-brand-500 text-white'
                          : 'bg-dark-950/70 border-dark-800 hover:border-dark-700 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{lvl.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE & DURATION */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-400" />
                  Weekly Availability & Time
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  How many days per week and how much time per session can you realistically dedicate to training?
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Workout Days Per Week</span>
                  <span className="text-brand-400 font-bold">{formData.workoutDaysPerWeek} Days / Week</span>
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, workoutDaysPerWeek: num })}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition ${
                        formData.workoutDaysPerWeek === num
                          ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                          : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Target Workout Duration</span>
                  <span className="text-brand-400 font-bold">{formData.preferredWorkoutDuration} Minutes</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {[
                    { val: 30, label: '30 min', desc: 'Express' },
                    { val: 45, label: '45 min', desc: 'Optimal' },
                    { val: 60, label: '60 min', desc: 'Standard' },
                    { val: 75, label: '75 min', desc: 'High Volume' },
                    { val: 90, label: '90 min', desc: 'Power Split' },
                    { val: 120, label: '120 min', desc: 'Extended / Elite' },
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredWorkoutDuration: dur.val })}
                      className={`p-3 rounded-xl border text-center transition ${
                        formData.preferredWorkoutDuration === dur.val
                          ? 'bg-brand-500/15 border-brand-500 text-white shadow-md'
                          : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm font-bold text-white">{dur.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{dur.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: EQUIPMENT */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-400" />
                  Available Equipment
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select all equipment you have access to. FitPilot AI only recommends exercises matching your gear.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {equipmentCatalog.map((eq) => {
                  const isChecked = formData.equipment.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipment(eq.id)}
                      className={`p-4 rounded-xl border text-left transition flex items-center space-x-3 ${
                        isChecked
                          ? 'bg-brand-500/15 border-brand-500 text-white shadow-md shadow-brand-500/10'
                          : 'bg-dark-950 border-dark-800 hover:border-dark-700 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">{eq.icon}</span>
                      <div className="text-xs font-semibold text-white flex-1">{eq.label}</div>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: WORKOUT PREFERENCES */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-brand-400" />
                  Exercise & Style Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customize the exercises you love and the ones you want your AI coach to replace or avoid.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Preferred Workout Style</label>
                <select
                  value={formData.preferences.preferredWorkoutStyle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, preferredWorkoutStyle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Hypertrophy / Muscle Building">Hypertrophy / Muscle Building</option>
                  <option value="Strength & Powerlifting">Strength & Powerlifting</option>
                  <option value="HIIT / High Intensity Interval">HIIT / High Intensity Interval</option>
                  <option value="Calisthenics & Bodyweight">Calisthenics & Bodyweight</option>
                  <option value="Functional / Athletic Conditioning">Functional / Athletic Conditioning</option>
                </select>
              </div>

              {/* Favorite Exercises */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Favorite Exercises</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={exerciseInput}
                    onChange={(e) => setExerciseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('pref_preferredExercises', exerciseInput, setExerciseInput);
                      }
                    }}
                    placeholder="e.g. Pull-ups, Deadlift (Press Enter)"
                    className="flex-1 px-4 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('pref_preferredExercises', exerciseInput, setExerciseInput)}
                    className="px-3 py-2 bg-dark-850 hover:bg-dark-800 text-xs font-semibold rounded-xl text-brand-400 border border-dark-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.preferences.preferredExercises.map((ex) => (
                    <span
                      key={ex}
                      className="px-2.5 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {ex}
                      <button
                        type="button"
                        onClick={() => removeTag('pref_preferredExercises', ex)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Disliked Exercises */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Exercises to Avoid / Dislike</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dislikeInput}
                    onChange={(e) => setDislikeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('pref_dislikedExercises', dislikeInput, setDislikeInput);
                      }
                    }}
                    placeholder="e.g. Lunges, Burpees (Press Enter)"
                    className="flex-1 px-4 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('pref_dislikedExercises', dislikeInput, setDislikeInput)}
                    className="px-3 py-2 bg-dark-850 hover:bg-dark-800 text-xs font-semibold rounded-xl text-red-400 border border-dark-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.preferences.dislikedExercises.map((ex) => (
                    <span
                      key={ex}
                      className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {ex}
                      <button
                        type="button"
                        onClick={() => removeTag('pref_dislikedExercises', ex)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: NUTRITION PROFILE */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-brand-400" />
                  Nutrition & Dietary Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your nutrition assistant complements your workouts with protein-aligned, practical meal plans.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Dietary Pattern</label>
                  <select
                    value={formData.nutritionPreferences.dietaryPreference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutritionPreferences: {
                          ...formData.nutritionPreferences,
                          dietaryPreference: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="omnivore">Omnivore (All foods)</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan / Plant-based</option>
                    <option value="pescatarian">Pescatarian</option>
                    <option value="keto">Ketogenic</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Cooking Time Preference</label>
                  <select
                    value={formData.nutritionPreferences.cookingTimePreference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nutritionPreferences: {
                          ...formData.nutritionPreferences,
                          cookingTimePreference: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="under_15_min">Quick & Express (&lt; 15 mins)</option>
                    <option value="15_30_min">Moderate (15 - 30 mins)</option>
                    <option value="30_60_min">Detailed Cooking (30 - 60 mins)</option>
                    <option value="meal_prep">Meal Prep Friendly</option>
                  </select>
                </div>
              </div>

              {/* Favorite Foods */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Favorite Foods & Staples</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={favFoodInput}
                    onChange={(e) => setFavFoodInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('nutri_favoriteFoods', favFoodInput, setFavFoodInput);
                      }
                    }}
                    placeholder="e.g. Eggs, Chicken breast, Oats (Press Enter)"
                    className="flex-1 px-4 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('nutri_favoriteFoods', favFoodInput, setFavFoodInput)}
                    className="px-3 py-2 bg-dark-850 hover:bg-dark-800 text-xs font-semibold rounded-xl text-brand-400 border border-dark-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.nutritionPreferences.favoriteFoods.map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeTag('nutri_favoriteFoods', f)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Disliked Foods */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Disliked Foods & Allergens</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dislikeFoodInput}
                    onChange={(e) => setDislikeFoodInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('nutri_dislikedFoods', dislikeFoodInput, setDislikeFoodInput);
                      }
                    }}
                    placeholder="e.g. Tofu, Peanuts, Dairy (Press Enter)"
                    className="flex-1 px-4 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('nutri_dislikedFoods', dislikeFoodInput, setDislikeFoodInput)}
                    className="px-3 py-2 bg-dark-850 hover:bg-dark-800 text-xs font-semibold rounded-xl text-red-400 border border-dark-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.nutritionPreferences.dislikedFoods.map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeTag('nutri_dislikedFoods', f)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-dark-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-700 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Configuring FitPilot AI...</span>
              ) : step === totalSteps ? (
                <>
                  <span>Complete Assessment & Launch</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
