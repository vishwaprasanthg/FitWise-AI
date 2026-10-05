import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  TrendingUp,
  Award,
  Trophy,
  Activity,
  Flame,
  Clock,
  Dumbbell,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchAnalytics = async (range) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/dashboard', {
        params: { timeRange: range || timeRange },
      });
      if (res && res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await apiClient.get('/analytics/insights');
      if (res && res.success && res.data?.insights) {
        setInsights(res.data.insights);
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
    fetchInsights();
  }, [timeRange]);

  const kpis = analytics?.kpis || {};
  const volumeData = analytics?.volumeTimeSeries || [];
  const personalRecords = analytics?.personalRecords || [];
  const weightTrend = analytics?.weightTrend || [];
  const recoveryTrend = analytics?.recoveryTrend || [];

  // Calculate volume chart dimensions
  const maxVolume = volumeData.length > 0 ? Math.max(...volumeData.map((d) => d.volumeKg), 500) : 500;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Time Range Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Athlete Performance Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Analytics & Progression Insights
            </h1>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center bg-dark-900 border border-dark-800 rounded-2xl p-1 shadow-md">
            {[
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
              { key: 'all', label: 'ALL' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTimeRange(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeRange === tab.key
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* HERO KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Volume Moved</span>
              <Dumbbell className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(kpis.rangeVolumeKg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Lifetime: <strong className="text-slate-200">{(kpis.lifetimeVolumeKg || 0).toLocaleString()} kg</strong>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Workouts Completed</span>
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {kpis.rangeWorkouts || 0} <span className="text-xs font-normal text-slate-500">sessions</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Lifetime: <strong className="text-slate-200">{kpis.lifetimeWorkouts || 0} workouts</strong>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Average Duration</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {kpis.avgDurationMinutes || 0} <span className="text-xs font-normal text-slate-500">mins</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Total Hours: <strong className="text-slate-200">{kpis.lifetimeHours || '0'} hrs</strong>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Recovery Readiness</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {kpis.latestRecoveryScore || 85}%
            </div>
            <div className="text-[11px] text-slate-400">
              Avg Feeling: <strong className="text-slate-200">{kpis.avgFeelingRating || 5.0} / 5.0</strong>
            </div>
          </div>
        </div>

        {/* LOADING SPINNER */}
        {loading && (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-3xl">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Synthesizing multi-dimensional training charts...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {/* VOLUME PROGRESSION CHART */}
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-dark-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <span>Training Volume Progression (kg)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mechanical workload per completed training session.
                  </p>
                </div>
                <div className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  Peak Load: {maxVolume.toLocaleString()} kg
                </div>
              </div>

              {volumeData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <p>No logged workout sessions found in this time period.</p>
                  <Link to="/workout/active?dayIndex=0" className="text-brand-400 font-semibold underline">
                    Log a workout session to see live volume charting
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Bar Graph */}
                  <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto border-b border-dark-800 scrollbar-thin">
                    {volumeData.map((item, idx) => {
                      const heightPercent = Math.max(12, Math.round((item.volumeKg / maxVolume) * 100));
                      return (
                        <div
                          key={item.logId || idx}
                          className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group relative"
                        >
                          {/* Tooltip on Hover */}
                          <div className="absolute -top-12 bg-dark-950 border border-dark-700 text-[10px] font-bold text-white py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-xl z-20">
                            {item.volumeKg} kg &bull; {item.durationMinutes}m
                          </div>

                          <div className="w-full bg-dark-950 rounded-xl overflow-hidden flex flex-col justify-end h-36 border border-dark-800/80">
                            <div
                              className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-lg transition-all duration-500 group-hover:from-brand-500 group-hover:to-brand-300"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>

                          <span className="text-[9px] font-mono text-slate-500 line-clamp-1">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Baseline Load</span>
                    <span>Progressive Overload Trajectory</span>
                  </div>
                </div>
              )}
            </div>

            {/* STRENGTH PR TROPHY SHOWCASE */}
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-dark-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Personal Records & 1RM Milestones</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Max load achieved and estimated 1 Rep Max using the scientific Epley formula.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {personalRecords.length} PRs Set
                </span>
              </div>

              {personalRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No personal records recorded yet. Complete workout sets to set your first PR!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalRecords.map((pr, pIdx) => (
                    <div
                      key={pIdx}
                      className="bg-dark-950 border border-dark-800 hover:border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3 transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                            Personal Record
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1 group-hover:text-amber-300 transition">
                            {pr.exerciseName}
                          </h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-dark-900 pt-3">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Max Lift</div>
                          <div className="text-lg font-black text-white">
                            {pr.maxWeightKg} <span className="text-xs font-normal text-slate-500">kg &bull; {pr.repsAtMax} reps</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Est. 1RM</div>
                          <div className="text-lg font-black text-amber-400">
                            {pr.estimated1RM} <span className="text-xs font-normal text-slate-500">kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Achieved: {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BODYWEIGHT & RECOVERY READINESS TRENDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bodyweight Trajectory */}
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-400" />
                    <span>Bodyweight Trajectory</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Current: <strong className="text-white">{weightTrend[weightTrend.length - 1]?.weightKg || 70} kg</strong>
                  </span>
                </div>

                {weightTrend.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No weigh-in data logged.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {weightTrend.slice(-5).map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-dark-950 p-3 rounded-xl border border-dark-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-brand-400" />
                          <span className="text-slate-300 font-semibold">{w.date}</span>
                          <span className="text-[10px] text-slate-500">({w.source})</span>
                        </div>
                        <span className="font-extrabold text-white">{w.weightKg} kg</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recovery Readiness Progression */}
              <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Recovery Readiness Trend</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Assessments: <strong className="text-white">{recoveryTrend.length}</strong>
                  </span>
                </div>

                {recoveryTrend.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No recovery assessments logged yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recoveryTrend.slice(-5).map((r, idx) => (
                      <div
                        key={idx}
                        className="bg-dark-950 p-3 rounded-xl border border-dark-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="text-slate-300 font-semibold">{r.date}</div>
                          <div className="text-[10px] text-slate-500">
                            {r.recoveryGrade} &bull; Action: {r.recommendedAction}
                          </div>
                        </div>
                        <span className={`text-sm font-extrabold ${
                          r.recoveryScore >= 75
                            ? 'text-emerald-400'
                            : r.recoveryScore >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}>
                          {r.recoveryScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI COACH PERFORMANCE EVALUATION CARD */}
            {insights && (
              <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold uppercase">
                        AI Coach Evaluation
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{insights.periodTitle}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Overall Grade</div>
                      <div className="text-2xl font-black text-brand-400">{insights.overallGrade}</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {insights.summary}
                </p>

                {insights.milestones?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Key Highlights & Overload Milestones:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {insights.milestones.map((m, idx) => (
                        <div
                          key={idx}
                          className="bg-dark-950 p-3 rounded-xl border border-dark-800 text-xs text-slate-300 flex items-center space-x-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.coachDirectives?.length > 0 && (
                  <div className="p-4 bg-dark-950 rounded-2xl border border-dark-800 space-y-2 text-xs">
                    <div className="font-bold text-brand-400 uppercase tracking-wider text-[10px]">
                      Coach Directives for Next Phase:
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {insights.coachDirectives.map((d, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-brand-400 font-bold">&bull;</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
