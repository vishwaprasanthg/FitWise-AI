import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  Dumbbell,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';

export const ExerciseLibraryPage = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
  const equipmentOptions = [
    { id: 'no_equipment', label: 'Bodyweight' },
    { id: 'dumbbells', label: 'Dumbbells' },
    { id: 'barbell', label: 'Barbell' },
    { id: 'bench', label: 'Bench' },
    { id: 'pull_up_bar', label: 'Pull-up Bar' },
    { id: 'cable_machine', label: 'Cable Machine' },
  ];

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMuscle) params.muscleGroup = selectedMuscle;
      if (selectedEquipment) params.equipment = selectedEquipment;
      if (searchQuery) params.search = searchQuery;

      const res = await apiClient.get('/workouts/exercises', { params });
      if (res && res.success && res.data?.exercises) {
        setExercises(res.data.exercises);
      }
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [selectedMuscle, selectedEquipment, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Curated Exercise Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Exercise Library & Form Guides
          </h1>
          <p className="text-xs text-slate-400">
            Explore {exercises.length} biomechanically verified compound and isolation movements used by FitPilot AI.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises (e.g. Bench Press, Squat, Pull-up)..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Equipment Filter */}
            <div className="w-full md:w-56">
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Equipment</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Muscle Group Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedMuscle('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 ${
                selectedMuscle === ''
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
              }`}
            >
              All Muscles
            </button>
            {muscleGroups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedMuscle(group)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 ${
                  selectedMuscle === group
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Grid */}
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Filtering exercises...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-dark-900 border border-dark-800 rounded-2xl">
            <p className="text-sm font-semibold text-white">No matching exercises found.</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or filter selections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((exercise) => {
              const isExpanded = expandedId === exercise.id;
              return (
                <div
                  key={exercise.id}
                  className="bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-2xl p-5 shadow-lg space-y-4 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold">
                          {exercise.targetMuscleGroup}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-dark-850 text-slate-400 text-[10px] capitalize">
                          {exercise.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-dark-850 text-slate-400 text-[10px] capitalize">
                          {exercise.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">{exercise.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target: <strong className="text-slate-200">{exercise.targetMuscle}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpand(exercise.id)}
                      className="p-2 bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white rounded-xl transition"
                      title="Toggle instructions"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-dark-800">
                    <span className="text-slate-500">Gear:</span>
                    {exercise.equipment.map((eq) => (
                      <span key={eq} className="px-2 py-0.5 bg-dark-950 border border-dark-800 rounded-lg text-slate-300">
                        {eq.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-dark-800 space-y-3 text-xs animate-fadeIn">
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-white">Form & Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-slate-400">
                          {exercise.instructions.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {exercise.tips && (
                        <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-300 text-[11px]">
                          <strong>Coach Form Cue: </strong> {exercise.tips}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
