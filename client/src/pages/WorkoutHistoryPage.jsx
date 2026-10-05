import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Calendar,
  Flame,
  Clock,
  Layers,
  Sparkles,
  Trophy,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Trash2,
  Play,
  RefreshCw,
  Info
} from 'lucide-react';

export const WorkoutHistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        apiClient.get('/workout-logs'),
        apiClient.get('/workout-logs/stats'),
      ]);

      if (logsRes && logsRes.success && logsRes.data?.logs) {
        setLogs(logsRes.data.logs);
      }
      if (statsRes && statsRes.success && statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load workout history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this workout log?')) return;
    setDeletingId(logId);
    try {
      const res = await apiClient.delete(`/workout-logs/${logId}`);
      if (res && res.success) {
        await fetchHistory();
      }
    } catch (err) {
      console.error('Failed to delete workout log:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const feelingMap = {
    1: { label: 'Exhausted', icon: '😫' },
    2: { label: 'Tough', icon: '😓' },
    3: { label: 'Solid', icon: '👍' },
    4: { label: 'Great', icon: '⚡' },
    5: { label: 'Crushed It', icon: '🔥' },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Training Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Workout History & Performance Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track your progressive overload, total tonnage moved, and consistency over time.
            </p>
          </div>

          <Link
            to="/workout/active"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Live Session</span>
          </Link>
        </div>

        {/* AGGREGATE STATS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Workouts Logged</span>
              <Trophy className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {stats?.totalWorkouts || 0}
            </div>
            <div className="text-[11px] text-slate-500">Total sessions completed</div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Volume Lifted</span>
              <Flame className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-brand-400">
              {(stats?.totalVolumeKg || 0) >= 1000
                ? `${((stats?.totalVolumeKg || 0) / 1000).toFixed(1)}k`
                : stats?.totalVolumeKg || 0}{' '}
              <span className="text-sm font-semibold text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-slate-500">Cumulative tonnage moved</div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sets Completed</span>
              <Layers className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {stats?.totalSets || 0}
            </div>
            <div className="text-[11px] text-slate-500">Total logged work sets</div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Avg Duration</span>
              <Clock className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {stats?.avgDurationMinutes || 0}{' '}
              <span className="text-sm font-semibold text-slate-400">mins</span>
            </div>
            <div className="text-[11px] text-slate-500">Average time per session</div>
          </div>
        </div>

        {/* LOGS LIST */}
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Retrieving workout ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No workouts recorded yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launch an active workout from your AI plan or freestyle session to start recording your sets and progressive overload.
            </p>
            <Link
              to="/workout/active"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Log Your First Workout</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log._id;
              const formattedDate = new Date(log.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = new Date(log.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log._id}
                  className="bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>{formattedDate}</span>
                        <span>&bull;</span>
                        <span>{formattedTime}</span>
                        {log.feelingRating && (
                          <>
                            <span>&bull;</span>
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <span>{feelingMap[log.feelingRating]?.icon}</span>
                              <span className="font-semibold text-brand-300">
                                {feelingMap[log.feelingRating]?.label}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {log.workoutDayName}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-center">
                        <div className="text-[9px] text-slate-500 font-semibold uppercase">Duration</div>
                        <div className="text-xs font-bold text-white">{log.durationMinutes}m</div>
                      </div>

                      <div className="px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-center">
                        <div className="text-[9px] text-slate-500 font-semibold uppercase">Volume</div>
                        <div className="text-xs font-bold text-brand-400">{log.totalVolumeKg} kg</div>
                      </div>

                      <div className="px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-xl text-center">
                        <div className="text-[9px] text-slate-500 font-semibold uppercase">Sets</div>
                        <div className="text-xs font-bold text-white">{log.totalSetsCompleted}</div>
                      </div>

                      <button
                        onClick={() => toggleExpand(log._id)}
                        className="p-2 bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white rounded-xl transition"
                        title="View set breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(log._id)}
                        disabled={deletingId === log._id}
                        className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes snippet if any */}
                  {log.notes && (
                    <div className="text-xs text-slate-400 italic bg-dark-950/60 p-3 rounded-xl border border-dark-800/60">
                      "{log.notes}"
                    </div>
                  )}

                  {/* EXPANDABLE SETS BREAKDOWN */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-dark-800 space-y-4 animate-fadeIn">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Exercise & Sets Breakdown
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {log.exercises.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="bg-dark-950 border border-dark-800 rounded-xl p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-white">
                              <span>{ex.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {ex.targetMuscle}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {ex.sets.map((set, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between text-[11px] text-slate-300 py-0.5 border-b border-dark-900 last:border-0"
                                >
                                  <span className="text-slate-500">Set {set.setNumber}</span>
                                  <span className="font-semibold text-white">
                                    {set.weightKg} kg &times; {set.actualReps} reps
                                  </span>
                                  <span className="text-brand-400">RPE {set.rpe}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
