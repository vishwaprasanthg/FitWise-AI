import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { RestTimerModal } from '../components/RestTimerModal';
import { WorkoutFinishModal } from '../components/WorkoutFinishModal';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Clock,
  Flame,
  Dumbbell,
  Sparkles,
  Layers,
  ArrowLeft,
  X,
  Search,
  CheckCircle2,
  Info
} from 'lucide-react';

export const ActiveWorkoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dayIndexParam = searchParams.get('dayIndex');

  const [loading, setLoading] = useState(true);
  const [workoutTitle, setWorkoutTitle] = useState('Freestyle Workout Session');
  const [workoutPlanId, setWorkoutPlanId] = useState(null);
  const [exercises, setExercises] = useState([]);

  // Stopwatch state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [startTime] = useState(new Date());

  // Rest Timer modal state
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [restDuration, setRestDuration] = useState(60);

  // Finish Workout modal state
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [savingLog, setSavingLog] = useState(false);

  // Exercise Catalog Selector Modal
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogExercises, setCatalogExercises] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');

  // 1. Load active plan workout day or freestyle
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        if (dayIndexParam !== null) {
          const res = await apiClient.get('/workouts/active');
          if (res && res.success && res.data?.plan) {
            const plan = res.data.plan;
            const targetDay = plan.schedule?.[parseInt(dayIndexParam)] || plan.schedule?.[0];
            if (targetDay && !targetDay.isRestDay) {
              setWorkoutPlanId(plan._id);
              setWorkoutTitle(`${targetDay.dayName} (${plan.title})`);
              const initialExercises = targetDay.exercises.map((ex, exIdx) => {
                const setCount = ex.sets || 3;
                const targetRepsNum = parseInt(ex.reps) || 10;
                return {
                  exerciseId: ex.exerciseId || `ex_${exIdx}`,
                  name: ex.name,
                  targetMuscle: ex.targetMuscle || 'Full Body',
                  equipment: ex.equipment || 'Standard',
                  restSeconds: ex.restSeconds || 60,
                  sets: Array.from({ length: setCount }, (_, sIdx) => ({
                    setNumber: sIdx + 1,
                    targetReps: ex.reps || '8-12 reps',
                    actualReps: targetRepsNum,
                    weightKg: 20,
                    rpe: ex.rpeTarget || 8,
                    completed: false,
                  })),
                };
              });
              setExercises(initialExercises);
            }
          }
        }

        // Fetch catalog for addition modal
        const catRes = await apiClient.get('/workouts/exercises');
        if (catRes && catRes.success && catRes.data?.exercises) {
          setCatalogExercises(catRes.data.exercises);
        }
      } catch (err) {
        console.error('Failed to load session details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [dayIndexParam]);

  // 2. Live Stopwatch
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // 3. Set operations
  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      const targetSets = [...targetExercise.sets];
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        [field]: value,
      };
      targetExercise.sets = targetSets;
      updated[exerciseIndex] = targetExercise;
      return updated;
    });
  };

  const toggleSetComplete = (exerciseIndex, setIndex, restSec) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      const targetSets = [...targetExercise.sets];
      const willBeCompleted = !targetSets[setIndex].completed;
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        completed: willBeCompleted,
      };
      targetExercise.sets = targetSets;
      updated[exerciseIndex] = targetExercise;

      // Automatically launch rest timer if newly completed
      if (willBeCompleted) {
        setRestDuration(restSec || 60);
        setRestModalOpen(true);
      }

      return updated;
    });
  };

  const addSetToExercise = (exerciseIndex) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      const lastSet = targetExercise.sets[targetExercise.sets.length - 1];
      targetExercise.sets = [
        ...targetExercise.sets,
        {
          setNumber: targetExercise.sets.length + 1,
          targetReps: lastSet?.targetReps || '8-12 reps',
          actualReps: lastSet?.actualReps || 10,
          weightKg: lastSet?.weightKg || 20,
          rpe: lastSet?.rpe || 8,
          completed: false,
        },
      ];
      updated[exerciseIndex] = targetExercise;
      return updated;
    });
  };

  const removeSetFromExercise = (exerciseIndex, setIndex) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      if (targetExercise.sets.length > 1) {
        targetExercise.sets = targetExercise.sets
          .filter((_, idx) => idx !== setIndex)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        updated[exerciseIndex] = targetExercise;
      }
      return updated;
    });
  };

  const addExerciseFromCatalog = (ex) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        targetMuscle: ex.targetMuscle,
        equipment: ex.equipment.join(', '),
        restSeconds: 60,
        sets: [
          { setNumber: 1, targetReps: '10 reps', actualReps: 10, weightKg: 20, rpe: 8, completed: false },
          { setNumber: 2, targetReps: '10 reps', actualReps: 10, weightKg: 20, rpe: 8, completed: false },
          { setNumber: 3, targetReps: '10 reps', actualReps: 10, weightKg: 20, rpe: 8, completed: false },
        ],
      },
    ]);
    setCatalogModalOpen(false);
  };

  const removeExercise = (exerciseIndex) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
  };

  // Live Metrics Calculations
  const totalVolumeKg = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, set) => {
        return set.completed ? sAcc + (set.actualReps || 0) * (set.weightKg || 0) : sAcc;
      }, 0)
    );
  }, 0);

  const totalSetsCompleted = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  // 4. Save Workout Session
  const handleSaveWorkout = async (feedbackData) => {
    setSavingLog(true);
    try {
      const payload = {
        workoutPlanId: workoutPlanId || undefined,
        workoutDayName: workoutTitle,
        startTime,
        endTime: new Date(),
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        exercises,
        feelingRating: feedbackData.feelingRating,
        notes: feedbackData.notes,
      };

      const res = await apiClient.post('/workout-logs', payload);
      if (res && res.success) {
        // Automatically mark the plan's day as completed
        const dayNumber = searchParams.get('dayNumber') || (dayIndexParam !== null ? parseInt(dayIndexParam) + 1 : null);
        if (dayNumber) {
          try {
            await apiClient.patch(`/workouts/active/day/${dayNumber}/status`, { status: 'completed' });
          } catch (e) {
            // Non-critical
          }
        }
        setFinishModalOpen(false);
        navigate('/workout/history');
      }
    } catch (err) {
      console.error('Failed to log workout session:', err);
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* TOP BAR / NAVIGATION & LIVE STATS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-dark-900 border border-dark-800 rounded-2xl p-5 sm:p-6 shadow-xl sticky top-20 z-40 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <Link
              to="/workouts"
              className="p-2 bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">
                  Active Workout Mode
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-1">
                {workoutTitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Live Stopwatch Badge */}
            <div className="flex items-center space-x-2 bg-dark-950 border border-dark-800 px-3.5 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-brand-400" />
              <span className="text-base font-extrabold font-mono text-white tracking-wider">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Live Volume Badge */}
            <div className="flex items-center space-x-2 bg-dark-950 border border-dark-800 px-3.5 py-2 rounded-xl">
              <Flame className="w-4 h-4 text-brand-400" />
              <div className="text-xs text-slate-400">
                Volume: <strong className="text-brand-400 font-bold">{totalVolumeKg} kg</strong>
              </div>
            </div>

            {/* Finish Workout CTA */}
            <button
              onClick={() => setFinishModalOpen(true)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish Workout</span>
            </button>
          </div>
        </div>

        {/* EXERCISES WORKOUT LIST */}
        {exercises.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
            <Dumbbell className="w-10 h-10 text-brand-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No exercises in this session yet</h3>
            <p className="text-xs text-slate-400">
              Add movements from the FitPilot exercise catalog to start logging your sets and weight.
            </p>
            <button
              onClick={() => setCatalogModalOpen(true)}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exercise</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {exercises.map((exercise, exIdx) => (
              <div
                key={exIdx}
                className="bg-dark-900 border border-dark-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition"
              >
                <div className="flex items-start justify-between gap-3 border-b border-dark-800 pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs mt-0.5">
                      {exIdx + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{exercise.name}</h3>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-brand-400">{exercise.targetMuscle}</span>
                        <span>&bull;</span>
                        <span>{exercise.equipment}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setRestDuration(exercise.restSeconds || 60);
                        setRestModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold border border-dark-700 flex items-center gap-1 transition"
                      title="Launch timer"
                    >
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      <span>{exercise.restSeconds || 60}s</span>
                    </button>

                    <button
                      onClick={() => removeExercise(exIdx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SETS TABLE */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-2">
                    <div className="col-span-2 text-center">Set</div>
                    <div className="col-span-3 text-center">Kg</div>
                    <div className="col-span-3 text-center">Reps</div>
                    <div className="col-span-2 text-center">RPE</div>
                    <div className="col-span-2 text-center">Done</div>
                  </div>

                  {exercise.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition ${
                        set.completed
                          ? 'bg-brand-500/10 border-brand-500/30'
                          : 'bg-dark-950/60 border-dark-800'
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-2 text-center font-bold text-xs text-slate-400">
                        {set.setNumber}
                      </div>

                      {/* Weight (Kg) */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={set.weightKg}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'weightKg', parseFloat(e.target.value) || 0)
                          }
                          className="w-full py-1.5 px-2 bg-dark-900 border border-dark-800 rounded-lg text-xs text-center text-white font-bold focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Actual Reps */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          value={set.actualReps}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'actualReps', parseInt(e.target.value) || 0)
                          }
                          className="w-full py-1.5 px-2 bg-dark-900 border border-dark-800 rounded-lg text-xs text-center text-white font-bold focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* RPE */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={set.rpe}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, 'rpe', parseInt(e.target.value) || 8)
                          }
                          className="w-full py-1.5 px-1 bg-dark-900 border border-dark-800 rounded-lg text-xs text-center text-slate-300 focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Complete Checkbox */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => toggleSetComplete(exIdx, setIdx, exercise.restSeconds)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                            set.completed
                              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                              : 'bg-dark-850 hover:bg-dark-800 text-slate-500 border border-dark-700'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Set Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => addSetToExercise(exIdx)}
                    className="px-3 py-1.5 bg-dark-950 hover:bg-dark-850 border border-dark-800 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-400" />
                    <span>Add Set</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Bottom Add Exercise Bar */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setCatalogModalOpen(true)}
                className="px-6 py-3 bg-dark-900 hover:bg-dark-850 border border-dark-800 hover:border-dark-700 text-white rounded-2xl text-xs font-bold shadow-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-brand-400" />
                <span>Add Another Exercise From Library</span>
              </button>
            </div>
          </div>
        )}

        {/* REST TIMER MODAL */}
        <RestTimerModal
          isOpen={restModalOpen}
          initialSeconds={restDuration}
          onClose={() => setRestModalOpen(false)}
        />

        {/* FINISH WORKOUT MODAL */}
        <WorkoutFinishModal
          isOpen={finishModalOpen}
          onClose={() => setFinishModalOpen(false)}
          onSave={handleSaveWorkout}
          saving={savingLog}
          durationMinutes={Math.max(1, Math.round(elapsedSeconds / 60))}
          totalVolumeKg={totalVolumeKg}
          totalSetsCompleted={totalSetsCompleted}
          exerciseCount={exercises.length}
          workoutTitle={workoutTitle}
        />

        {/* EXERCISE CATALOG SELECTOR MODAL */}
        {catalogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 relative max-h-[85vh] flex flex-col">
              <button
                onClick={() => setCatalogModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-dark-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Add Exercise to Workout</h3>
                <p className="text-xs text-slate-400">Select a movement to add to your live session.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search exercise..."
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Exercises List */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 scrollbar-thin">
                {catalogExercises
                  .filter((ex) =>
                    ex.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    ex.targetMuscleGroup.toLowerCase().includes(catalogSearch.toLowerCase())
                  )
                  .map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addExerciseFromCatalog(ex)}
                      className="w-full p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500/40 rounded-xl text-left transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-brand-400 transition">
                          {ex.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ex.targetMuscleGroup} &bull; {ex.equipment.join(', ')}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
