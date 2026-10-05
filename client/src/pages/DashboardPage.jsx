import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  ArrowRight, 
  LogOut, 
  RefreshCw, 
  Target,
  Layers,
  Calendar,
  Heart,
  Utensils,
  Dumbbell,
  Clock,
  Play,
  Zap,
  TrendingUp,
  Flame,
  Check,
  FastForward,
  RotateCcw,
  Trophy,
  Moon
} from 'lucide-react';
import apiClient from '../api/client';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activePlan, setActivePlan] = useState(null);
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [planRes, checkInRes] = await Promise.all([
        apiClient.get('/workouts/active'),
        apiClient.get('/check-ins/latest'),
      ]);

      if (planRes && planRes.success && planRes.data?.plan) {
        setActivePlan(planRes.data.plan);
      } else {
        setActivePlan(null);
      }
      if (checkInRes && checkInRes.success && checkInRes.data?.checkIn) {
        setLatestCheckIn(checkInRes.data.checkIn);
      }
    } catch (err) {
      // Handle gracefully
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateCurrentDayStatus = async (dayNumber, status) => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/workouts/active/day/${dayNumber}/status`, { status });
      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        const label = status === 'completed' ? 'marked Done ✓' : 'Skipped ⏭️';
        setToastMessage(`Day ${dayNumber} ${label}`);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      console.error('Failed to update day status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCycle = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post('/workouts/active/reset-cycle');
      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        setToastMessage('7-Day Cycle restarted at Day 1!');
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      console.error('Failed to reset cycle:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const goalLabels = {
    muscle_gain: 'Muscle Gain & Hypertrophy',
    weight_loss: 'Fat Loss & Toning',
    strength: 'Strength & Power',
    endurance: 'Endurance & Stamina',
    general_fitness: 'General Fitness',
    maintenance: 'Maintenance',
  };

  const levelLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  // 7-day schedule & current active day
  const schedule = activePlan?.schedule || [];
  const currentDayNum = activePlan?.currentDayNumber || 1;
  const currentDayIndex = Math.max(0, currentDayNum - 1);
  const currentDay = schedule[currentDayIndex] || schedule[0] || null;

  const isCycleCompleted = schedule.length > 0 && schedule.every((d) => d.status === 'completed' || d.status === 'skipped');
  const completedCount = schedule.filter((d) => d.status === 'completed').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 card-silver">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white text-xl font-bold shadow-red-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Welcome, {user?.name}!</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold">
                  {user?.onboardingCompleted ? 'Profile Active' : 'Assessment Pending'}
                </span>
              </div>
              <p className="text-xs text-silver-400 mt-1">
                Account ID: <span className="font-mono text-silver-300">{user?._id}</span> &bull; {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Link
              to="/chat"
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Coach Pulse</span>
            </Link>
            <Link
              to="/check-in"
              className="px-4 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Check-in</span>
            </Link>
            <Link
              to="/workouts"
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-red-sm transition flex items-center gap-1.5"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Workouts</span>
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 rounded-xl text-xs font-bold text-silver-300 hover:text-white transition flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
            <button
              onClick={logout}
              className="p-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-xl text-xs font-bold text-brand-400 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-xs text-brand-300 flex items-center space-x-3 shadow-silver-sm animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* ONBOARDING CALL-TO-ACTION BANNER (If not yet completed) */}
        {!user?.onboardingCompleted ? (
          <div className="relative overflow-hidden bg-dark-900 border-2 border-brand-500/50 rounded-3xl p-8 card-silver space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Action Required &bull; Assessment</span>
            </div>
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Complete Your Fitness & Nutrition Assessment
              </h2>
              <p className="text-xs text-silver-400 leading-relaxed">
                FitPilot AI needs to understand your physical stats, goals, equipment, and nutrition preferences to build your personalized AI workout plans and coaching loop.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition"
            >
              <span>Launch Onboarding Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* WORKOUT HIGHLIGHT & PERSONALIZED PROFILE */
          <div className="space-y-6">
            {/* WEEKLY CHECK-IN PROMPT BANNER */}
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-6 card-silver flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mt-0.5 shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">AI Coach Weekly Check-in</h3>
                    {latestCheckIn && (
                      <span className="px-2 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold rounded-full">
                        Recovery: {latestCheckIn.recoveryScore}% ({latestCheckIn.aiCoachFeedback?.recoveryGrade})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-silver-400 mt-0.5">
                    {latestCheckIn
                      ? `Last assessed on ${new Date(latestCheckIn.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Ready to log your current fatigue and adapt next week's routine?`
                      : 'Complete your weekly athlete check-in to evaluate fatigue and apply overload progression.'}
                  </p>
                </div>
              </div>

              <Link
                to="/check-in"
                className="px-4 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 hover:border-brand-500/40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Start Check-in</span>
              </Link>
            </div>

            {/* ACTIVE 7-DAY WORKOUT PROGRESSION WIDGET */}
            {activePlan && currentDay ? (
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 card-silver space-y-6">
                {/* Header with Title & Current Day info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                      <Flame className="w-4 h-4" />
                      <span>Active Program &bull; {activePlan.title}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {currentDay.dayName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold">
                        Day {currentDay.dayNumber} of 7
                      </span>
                    </div>
                    <p className="text-xs text-silver-400">
                      Target: <strong className="text-white">{currentDay.targetMuscles?.join(', ') || 'Rest & Recovery'}</strong> &bull; Duration: <strong className="text-white">{currentDay.estimatedDuration} mins</strong>
                    </p>
                  </div>

                  {/* Day Action Buttons: Start Workout, Done, Skip */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {!currentDay.isRestDay ? (
                      <button
                        onClick={() => navigate(`/workout/active?dayIndex=${currentDayIndex}&dayNumber=${currentDay.dayNumber}`)}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Day {currentDay.dayNumber} Workout</span>
                      </button>
                    ) : (
                      <div className="px-3.5 py-2 bg-dark-950 border border-dark-800 text-silver-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-brand-400" />
                        <span>Scheduled Rest Day</span>
                      </div>
                    )}

                    {currentDay.status !== 'completed' ? (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateCurrentDayStatus(currentDay.dayNumber, 'completed')}
                        className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 hover:border-brand-500/40 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                        title="Mark day as complete"
                      >
                        <Check className="w-3.5 h-3.5 text-brand-400" />
                        <span>{currentDay.isRestDay ? 'Rest Taken' : 'Mark Done'}</span>
                      </button>
                    ) : (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateCurrentDayStatus(currentDay.dayNumber, 'pending')}
                        className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 text-silver-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}

                    {currentDay.status !== 'skipped' && currentDay.status !== 'completed' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateCurrentDayStatus(currentDay.dayNumber, 'skipped')}
                        className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 text-silver-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                        title="Skip to next day"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>Skip Day</span>
                      </button>
                    )}

                    <Link
                      to="/workouts"
                      className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition"
                    >
                      View All 7 Days
                    </Link>
                  </div>
                </div>

                {/* 7-Day Visual Tracker Ribbon */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-silver-400">
                    <span>Weekly 7-Day Routine Progress</span>
                    <span className="text-brand-400 font-mono">{completedCount} / 7 Days Completed</span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {schedule.map((day, idx) => {
                      const isCurrent = day.dayNumber === currentDayNum;
                      const isDone = day.status === 'completed';
                      const isSkipped = day.status === 'skipped';

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                            isCurrent
                              ? 'bg-dark-850 border-brand-500 shadow-red-sm ring-1 ring-brand-500'
                              : isDone
                              ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                              : isSkipped
                              ? 'bg-dark-950/60 border-dark-850 text-silver-500'
                              : 'bg-dark-950 border-dark-800 text-silver-400'
                          }`}
                        >
                          <span className="text-[10px] font-extrabold uppercase">Day {day.dayNumber}</span>
                          <div>
                            {isDone ? (
                              <Check className="w-3.5 h-3.5 text-brand-400 stroke-[3]" />
                            ) : isSkipped ? (
                              <span className="text-[9px] font-bold text-silver-500">Skip</span>
                            ) : isCurrent ? (
                              <Flame className="w-3.5 h-3.5 text-brand-400 fill-current animate-pulse" />
                            ) : day.isRestDay ? (
                              <Moon className="w-3 h-3 text-silver-500" />
                            ) : (
                              <Dumbbell className="w-3 h-3 text-silver-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Exercise Snippets for Current Day */}
                {!currentDay.isRestDay && currentDay.exercises?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {currentDay.exercises.slice(0, 3).map((ex, idx) => (
                      <div key={idx} className="p-4 bg-dark-950 rounded-2xl border border-dark-800 space-y-1 shadow-silver-sm">
                        <div className="text-xs font-bold text-white line-clamp-1">{ex.name}</div>
                        <div className="text-[11px] text-silver-400">
                          {ex.sets} sets &bull; {ex.reps} &bull; {ex.targetMuscle}
                        </div>
                      </div>
                    ))}
                    {currentDay.exercises.length > 3 && (
                      <div className="p-4 bg-dark-950/50 rounded-2xl border border-dashed border-dark-800 flex items-center justify-center text-xs text-silver-400">
                        + {currentDay.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* CTA TO GENERATE FIRST WORKOUT */
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 card-silver flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Engine Ready</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Generate Your 7-Day AI Workout Progression
                  </h2>
                  <p className="text-xs text-silver-400 leading-relaxed">
                    FitPilot AI will use your {user?.profile?.equipment?.length || 0} equipment items and {user?.profile?.workoutDaysPerWeek || 4}-day schedule to engineer your routine.
                  </p>
                </div>
                <Link
                  to="/workouts"
                  className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center gap-2 flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Workout Plan</span>
                </Link>
              </div>
            )}

            {/* ATHLETE TELEMETRY & PHYSICAL PROFILE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Calories & Nutrition Blueprint */}
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-7 card-silver space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <Utensils className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-bold text-white">Daily Calorie & Macro Target</h3>
                  </div>
                  <Link to="/nutrition" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition">
                    View Blueprint &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 font-bold uppercase">Daily Goal</span>
                    <div className="text-lg font-black text-brand-400">
                      {user?.profile?.nutritionPreferences?.targetDailyCalories || 2600}
                    </div>
                    <span className="text-[10px] text-silver-500 font-mono">kcal/day</span>
                  </div>

                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 font-bold uppercase">Diet Style</span>
                    <div className="text-xs font-black text-white capitalize mt-1.5">
                      {user?.profile?.nutritionPreferences?.dietaryPreference || 'Omnivore'}
                    </div>
                    <span className="text-[10px] text-silver-500 font-mono">
                      {user?.profile?.nutritionPreferences?.mealsPerDay || 4} meals/day
                    </span>
                  </div>

                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 font-bold uppercase">Water Target</span>
                    <div className="text-lg font-black text-white">3.5L</div>
                    <span className="text-[10px] text-silver-500 font-mono">daily min</span>
                  </div>
                </div>
              </div>

              {/* Physical Telemetry */}
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-7 card-silver space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <Activity className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-bold text-white">Athlete Physical Baseline</h3>
                  </div>
                  <Link to="/profile" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition">
                    Edit Stats &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 uppercase font-bold">Weight</span>
                    <div className="text-base font-black text-white">{user?.profile?.weight || '--'} kg</div>
                  </div>
                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 uppercase font-bold">Height</span>
                    <div className="text-base font-black text-white">{user?.profile?.height || '--'} cm</div>
                  </div>
                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 uppercase font-bold">Age / Gender</span>
                    <div className="text-base font-black text-white capitalize">
                      {user?.profile?.age || '--'} / {user?.profile?.gender ? user.profile.gender.charAt(0) : '--'}
                    </div>
                  </div>
                  <div className="bg-dark-950 p-3 rounded-xl border border-dark-800 shadow-silver-sm">
                    <span className="text-[10px] text-silver-400 uppercase font-bold">Level</span>
                    <div className="text-base font-black text-brand-400 capitalize">
                      {levelLabels[user?.profile?.fitnessLevel] || 'Intermediate'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
