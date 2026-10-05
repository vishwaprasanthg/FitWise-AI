import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { RestTimerModal } from '../components/RestTimerModal';
import {
  Dumbbell,
  Sparkles,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Target,
  Layers,
  Info,
  X,
  Zap,
  Moon,
  Check,
  FastForward,
  Trophy
} from 'lucide-react';

export const WorkoutPlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activePlan, setActivePlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingDayNum, setUpdatingDayNum] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Rest timer modal state
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);

  // Expanded instructions map
  const [expandedExercise, setExpandedExercise] = useState({});

  // Generate modal state
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    customNotes: '',
  });

  const fetchWorkoutPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const activeRes = await apiClient.get('/workouts/active');
      if (activeRes && activeRes.success && activeRes.data?.plan) {
        const plan = activeRes.data.plan;
        setActivePlan(plan);
        // Default selected day to current active day in progression
        const activeIdx = (plan.currentDayNumber || 1) - 1;
        setSelectedDayIndex(Math.max(0, Math.min(activeIdx, (plan.schedule?.length || 1) - 1)));
      } else {
        setActivePlan(null);
      }

      const allRes = await apiClient.get('/workouts/plans');
      if (allRes && allRes.success && allRes.data?.plans) {
        setAllPlans(allRes.data.plans);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccessMessage('');
    try {
      // Sends customNotes while server automatically uses user.profile for equipment, goal, fitnessLevel, daysPerWeek
      const res = await apiClient.post('/workouts/generate', {
        customNotes: generateOptions.customNotes,
      });

      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        setSelectedDayIndex(0);
        setGenerateModalOpen(false);
        setSuccessMessage('New 7-Day AI Workout Blueprint generated successfully!');
        setTimeout(() => setSuccessMessage(''), 4500);
        await fetchWorkoutPlans();
      } else {
        setError(res.message || 'Unable to generate workout plan');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during AI plan generation');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateDayStatus = async (dayNumber, status) => {
    setUpdatingDayNum(dayNumber);
    setError('');
    try {
      const res = await apiClient.patch(`/workouts/active/day/${dayNumber}/status`, { status });
      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        const statusLabel = status === 'completed' ? 'marked Done ✓' : status === 'skipped' ? 'Skipped ⏭️' : 'Reset to Pending';
        setSuccessMessage(`Day ${dayNumber} ${statusLabel}`);
        setTimeout(() => setSuccessMessage(''), 3500);
      } else {
        setError(res.message || 'Failed to update day status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingDayNum(null);
    }
  };

  const handleResetCycle = async () => {
    setError('');
    try {
      const res = await apiClient.post('/workouts/active/reset-cycle');
      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        setSelectedDayIndex(0);
        setSuccessMessage('7-Day Cycle restarted at Day 1!');
        setTimeout(() => setSuccessMessage(''), 4500);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset cycle');
    }
  };

  const handleSwitchPlan = async (planId) => {
    try {
      const res = await apiClient.patch(`/workouts/plans/${planId}/active`);
      if (res && res.success && res.data?.plan) {
        setActivePlan(res.data.plan);
        setSelectedDayIndex(0);
        await fetchWorkoutPlans();
      }
    } catch (err) {
      setError(err.message || 'Failed to switch workout plan');
    }
  };

  const toggleExpand = (id) => {
    setExpandedExercise((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openTimer = (seconds) => {
    setTimerDuration(seconds || 60);
    setTimerModalOpen(true);
  };

  const schedule = activePlan?.schedule || [];
  const selectedDay = schedule[selectedDayIndex] || null;
  const currentDayNumber = activePlan?.currentDayNumber || 1;

  // Calculate overall 7-day progress
  const completedDaysCount = schedule.filter((d) => d.status === 'completed').length;
  const skippedDaysCount = schedule.filter((d) => d.status === 'skipped').length;
  const isCycleFinished = schedule.length > 0 && schedule.every((d) => d.status === 'completed' || d.status === 'skipped');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Title & Action Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 7-Day Workout Progression</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activePlan ? activePlan.title : 'Personalized Workout Plan'}
            </h1>
            <p className="text-xs text-silver-400 mt-1">
              Calibrated to your {user?.profile?.fitnessLevel || 'intermediate'} level, {user?.profile?.workoutDaysPerWeek || 4} days/week schedule, and {user?.profile?.equipment?.join(', ') || 'available gear'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activePlan && (
              <button
                onClick={handleResetCycle}
                className="px-4 py-2.5 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                title="Restart 7-day cycle from Day 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cycle</span>
              </button>
            )}

            <button
              onClick={() => setGenerateModalOpen(true)}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Workout Plan</span>
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

        {/* LOADING STATE */}
        {loading && (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-3xl card-silver">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-silver-400 font-medium">Retrieving your 7-day workout progression...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !activePlan && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-10 text-center space-y-5 max-w-xl mx-auto card-silver">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto shadow-red-sm">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">No Active Workout Plan Yet</h2>
              <p className="text-xs text-silver-400 leading-relaxed">
                FitPilot AI is ready to engineer a personalized 7-day progressive workout split using your saved profile settings ({user?.profile?.workoutDaysPerWeek || 4} days/week with {user?.profile?.equipment?.join(', ') || 'bodyweight'}).
              </p>
            </div>
            <button
              onClick={() => setGenerateModalOpen(true)}
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Workout Plan</span>
            </button>
          </div>
        )}

        {/* ACTIVE 7-DAY PROGRESSION TRACKER & SCHEDULE */}
        {!loading && activePlan && (
          <div className="space-y-6">
            {/* 7-DAY PROGRESSION TIMELINE */}
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 card-silver space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-dark-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" />
                    <span>7-Day Routine Progression &bull; Day {currentDayNumber} of 7 Active</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    Weekly Training Cycle Overview
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-silver-400">
                    Completed: <strong className="text-brand-400">{completedDaysCount}</strong> / 7 Days
                  </span>
                  {skippedDaysCount > 0 && (
                    <span className="text-silver-500 text-[11px]">({skippedDaysCount} skipped)</span>
                  )}
                </div>
              </div>

              {/* Day 1 to Day 7 Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {schedule.map((day, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  const isCurrent = day.dayNumber === currentDayNumber;
                  const isCompleted = day.status === 'completed';
                  const isSkipped = day.status === 'skipped';

                  return (
                    <button
                      key={day._id || idx}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 relative ${
                        isSelected
                          ? 'bg-dark-850 border-brand-500 shadow-red-sm ring-1 ring-brand-500'
                          : isCurrent
                          ? 'bg-dark-950 border-brand-500/50 hover:border-brand-500 shadow-silver-sm'
                          : 'bg-dark-950 border-dark-800 hover:border-dark-700 shadow-silver-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-white">Day {day.dayNumber}</span>
                        {isCompleted ? (
                          <div className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isSkipped ? (
                          <span className="text-[9px] font-extrabold text-silver-400 uppercase">Skip</span>
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                        ) : null}
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-silver-300 line-clamp-1">
                          {day.isRestDay ? 'Rest & Mobility' : day.targetMuscles?.[0] || 'Workout'}
                        </div>
                        <div className="text-[9px] text-silver-500 font-mono">
                          {day.isRestDay ? 'Rest Day' : `${day.estimatedDuration} mins`}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="pt-1">
                        {isCompleted ? (
                          <span className="text-[9px] font-bold text-brand-400">Done ✓</span>
                        ) : isSkipped ? (
                          <span className="text-[9px] font-bold text-silver-500">Skipped</span>
                        ) : isCurrent ? (
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-brand-500/20 px-1.5 py-0.5 rounded border border-brand-500/30">
                            Current
                          </span>
                        ) : (
                          <span className="text-[9px] text-silver-500">Pending</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CYCLE FINISHED CELEBRATION */}
              {isCycleFinished && (
                <div className="p-4 bg-gradient-to-r from-brand-950/60 to-dark-900 border border-brand-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-silver-sm animate-fadeIn">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-red-sm">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">7-Day Training Cycle Complete!</h4>
                      <p className="text-xs text-silver-300">
                        Awesome consistency! You completed {completedDaysCount} sessions. Ready to restart or evolve with AI?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetCycle}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-red-sm transition"
                    >
                      Start Next Cycle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SELECTED DAY WORKOUT DETAILS & EXERCISE LIST */}
            {selectedDay && (
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 card-silver space-y-6">
                {/* Day Header & Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold">
                        Day {selectedDay.dayNumber} of 7
                      </span>
                      {selectedDay.status === 'completed' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Done</span>
                        </span>
                      )}
                      {selectedDay.status === 'skipped' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-silver-500/10 text-silver-400 border border-silver-500/20 text-xs font-bold">
                          Skipped
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {selectedDay.dayName}
                    </h2>
                    <p className="text-xs text-silver-400">
                      Target Muscles: <strong className="text-white">{selectedDay.targetMuscles?.join(', ') || 'Rest'}</strong> &bull; Estimated: <strong className="text-white">{selectedDay.estimatedDuration} mins</strong>
                    </p>
                  </div>

                  {/* Day Action Controls: Start Workout, Done, Skip */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!selectedDay.isRestDay && (
                      <button
                        onClick={() => navigate(`/workout/active?dayIndex=${selectedDayIndex}&dayNumber=${selectedDay.dayNumber}`)}
                        className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-red-sm hover:shadow-red-glow transition flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Workout</span>
                      </button>
                    )}

                    {selectedDay.status !== 'completed' ? (
                      <button
                        disabled={updatingDayNum === selectedDay.dayNumber}
                        onClick={() => handleUpdateDayStatus(selectedDay.dayNumber, 'completed')}
                        className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 hover:border-brand-500/40 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                        title="Mark day workout as completed"
                      >
                        <Check className="w-3.5 h-3.5 text-brand-400" />
                        <span>{selectedDay.isRestDay ? 'Rest Taken' : 'Mark Done'}</span>
                      </button>
                    ) : (
                      <button
                        disabled={updatingDayNum === selectedDay.dayNumber}
                        onClick={() => handleUpdateDayStatus(selectedDay.dayNumber, 'pending')}
                        className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 text-silver-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                        title="Reset day status back to pending"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Status</span>
                      </button>
                    )}

                    {selectedDay.status !== 'skipped' && selectedDay.status !== 'completed' && (
                      <button
                        disabled={updatingDayNum === selectedDay.dayNumber}
                        onClick={() => handleUpdateDayStatus(selectedDay.dayNumber, 'skipped')}
                        className="px-3.5 py-2.5 bg-dark-850 hover:bg-dark-800 border border-dark-800 text-silver-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
                        title="Skip this day and advance to next"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>Skip Day</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* REST DAY DISPLAY */}
                {selectedDay.isRestDay ? (
                  <div className="p-8 text-center space-y-4 bg-dark-950 rounded-2xl border border-dark-800 shadow-silver-sm">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-white">Scheduled Active Recovery & Rest</h3>
                      <p className="text-xs text-silver-400 max-w-md mx-auto leading-relaxed">
                        Allow your central nervous system and muscle fibers to repair and adapt. Focus on hydration, mobility stretching, and meeting your daily protein targets.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* EXERCISES LIST */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-silver-400 uppercase tracking-wider">
                      <span>Prescribed Exercises ({selectedDay.exercises?.length || 0})</span>
                      <span>Target Volume & RPE</span>
                    </div>

                    <div className="space-y-3">
                      {selectedDay.exercises?.map((ex, exIdx) => {
                        const isExpanded = expandedExercise[ex._id || exIdx];
                        return (
                          <div
                            key={ex._id || exIdx}
                            className="bg-dark-950 border border-dark-800 rounded-2xl p-4 sm:p-5 shadow-silver-sm space-y-3 transition hover:border-brand-500/30"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {exIdx + 1}
                                  </span>
                                  <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                                    {ex.name}
                                  </h4>
                                  <span className="text-[10px] font-mono text-silver-400 bg-dark-900 border border-dark-800 px-2 py-0.5 rounded-full">
                                    {ex.equipment}
                                  </span>
                                </div>
                                <div className="text-xs text-silver-400 pl-7">
                                  Target: <strong className="text-silver-200">{ex.targetMuscle}</strong> &bull; Recommended Weight: <strong className="text-brand-400">{ex.weightRecommendation}</strong>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pl-7 sm:pl-0">
                                <div className="flex items-center space-x-2 text-xs font-mono bg-dark-900 border border-dark-800 px-3 py-1.5 rounded-xl">
                                  <span className="text-white font-bold">{ex.sets} Sets</span>
                                  <span className="text-silver-500">&bull;</span>
                                  <span className="text-silver-300">{ex.reps}</span>
                                  <span className="text-silver-500">&bull;</span>
                                  <span className="text-brand-400">RPE {ex.rpeTarget}</span>
                                </div>

                                <button
                                  onClick={() => openTimer(ex.restSeconds)}
                                  className="p-2 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-silver-400 hover:text-white rounded-xl text-xs transition"
                                  title={`Rest timer: ${ex.restSeconds}s`}
                                >
                                  <Clock className="w-4 h-4 text-brand-400" />
                                </button>
                              </div>
                            </div>

                            {/* Form cues & instructions */}
                            {ex.instructions?.length > 0 && (
                              <div className="pl-7 pt-2 border-t border-dark-850">
                                <button
                                  onClick={() => toggleExpand(ex._id || exIdx)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-silver-400 hover:text-white transition"
                                >
                                  <span>{isExpanded ? 'Hide Form Technique' : 'View Form & Execution'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-brand-400" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-400" />}
                                </button>

                                {isExpanded && (
                                  <div className="mt-3 space-y-2 text-xs text-silver-300 animate-fadeIn">
                                    <ol className="list-decimal list-inside space-y-1">
                                      {ex.instructions.map((step, sIdx) => (
                                        <li key={sIdx} className="leading-relaxed">
                                          {step}
                                        </li>
                                      ))}
                                    </ol>
                                    {ex.tips && (
                                      <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-[11px] text-brand-300 font-medium">
                                        💡 <strong>Coach Cue:</strong> {ex.tips}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GENERATE WORKOUT MODAL (Uses Profile Stats Directly) */}
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
                  <span>Gemini Workout Engine</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Generate 7-Day AI Workout Plan</h3>
                <p className="text-xs text-silver-400">
                  FitPilot AI will automatically synthesize a complete Day 1 to Day 7 progressive workout program using your saved athlete profile.
                </p>
              </div>

              {/* Profile Config Summary Banner (No redundant input fields!) */}
              <div className="p-4 bg-dark-950 rounded-2xl border border-dark-800 space-y-2 shadow-silver-sm">
                <span className="text-[10px] font-bold text-silver-500 uppercase tracking-wider">
                  Loaded From Athlete Profile:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-silver-500">Goal:</span>{' '}
                    <strong className="text-white capitalize">{user?.profile?.primaryGoal?.replace('_', ' ') || 'Muscle Gain'}</strong>
                  </div>
                  <div>
                    <span className="text-silver-500">Experience:</span>{' '}
                    <strong className="text-white capitalize">{user?.profile?.fitnessLevel || 'Intermediate'}</strong>
                  </div>
                  <div>
                    <span className="text-silver-500">Weekly Schedule:</span>{' '}
                    <strong className="text-brand-400">{user?.profile?.workoutDaysPerWeek || 4} Days Training</strong>
                  </div>
                  <div>
                    <span className="text-silver-500">Session Duration:</span>{' '}
                    <strong className="text-white">{user?.profile?.preferredWorkoutDuration || 45} mins</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-silver-500">Equipment:</span>{' '}
                    <strong className="text-silver-200 capitalize">
                      {user?.profile?.equipment?.length ? user.profile.equipment.join(', ') : 'Dumbbells, Bench'}
                    </strong>
                  </div>
                </div>
              </div>

              <form onSubmit={handleGeneratePlan} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">
                    Special Training Focus or Custom Coach Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={generateOptions.customNotes}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, customNotes: e.target.value })}
                    placeholder="e.g. Focus on chest hypertrophy, include shoulder mobility, prioritize barbell movements..."
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
                      <span>FitPilot AI is Engineering Your 7-Day Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate 7-Day AI Workout Blueprint</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* REST TIMER MODAL */}
        <RestTimerModal
          isOpen={timerModalOpen}
          onClose={() => setTimerModalOpen(false)}
          defaultDuration={timerDuration}
        />
      </div>
    </div>
  );
};
