import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Heart,
  Scale,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';

export const CheckInHistoryPage = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckIns = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/check-ins');
      if (res && res.success && res.data?.checkIns) {
        setCheckIns(res.data.checkIns);
      }
    } catch (err) {
      console.error('Failed to load check-in history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const actionLabels = {
    progressive_overload: 'Progressive Overload Applied',
    increase_volume: 'Volume Scaled (+1 Work Set)',
    increase_intensity: 'Load Intensity Bumped (+2.5kg)',
    deload: 'Active Deload Scheduled (Recovery Phase)',
    maintain: 'Routine Maintained',
    adjust_exercises: 'Exercise Variations Refreshed',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/check-in"
              className="p-2 bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-white rounded-xl border border-dark-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Coaching Ledger</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Athlete Check-in History
              </h1>
            </div>
          </div>

          <Link
            to="/check-in"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Weekly Check-in</span>
          </Link>
        </div>

        {/* FEED */}
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Retrieving coaching records...</p>
          </div>
        ) : checkIns.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Check-in Reports Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your first weekly check-in to generate a full recovery score assessment and tailored progressive overload plan.
            </p>
            <Link
              to="/check-in"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Complete First Check-in</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {checkIns.map((checkIn) => {
              const formattedDate = new Date(checkIn.checkInDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={checkIn._id}
                  className="bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-3xl p-6 shadow-xl space-y-5 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-800 pb-4">
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        <span>{formattedDate}</span>
                        {checkIn.currentWeight && (
                          <>
                            <span>&bull;</span>
                            <span className="font-semibold text-slate-300">
                              Weight: {checkIn.currentWeight} kg
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{actionLabels[checkIn.aiCoachFeedback?.recommendedAction] || checkIn.aiCoachFeedback?.recommendedAction}</span>
                      </h3>
                    </div>

                    {/* Recovery Gauge Badge */}
                    <div className="flex items-center space-x-3 bg-dark-950 px-4 py-2 rounded-2xl border border-dark-800">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Recovery</div>
                        <div className={`text-base font-black ${
                          checkIn.recoveryScore >= 75
                            ? 'text-emerald-400'
                            : checkIn.recoveryScore >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}>
                          {checkIn.recoveryScore}%
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-white border-l border-dark-800 pl-3">
                        {checkIn.aiCoachFeedback?.recoveryGrade || 'Optimal'}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Details */}
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-dark-950 rounded-2xl border border-dark-800 space-y-1">
                      <div className="font-bold text-brand-400 uppercase tracking-wider text-[10px]">
                        AI Coach Rationale
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {checkIn.aiCoachFeedback?.analysisSummary}
                      </p>
                    </div>

                    <div className="p-4 bg-dark-950 rounded-2xl border border-dark-800 space-y-1">
                      <div className="font-bold text-brand-400 uppercase tracking-wider text-[10px]">
                        Progression Instructions
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {checkIn.aiCoachFeedback?.progressionNotes}
                      </p>
                    </div>

                    {checkIn.userFeedback && (
                      <div className="text-[11px] text-slate-400 italic px-2">
                        Athlete Note: "{checkIn.userFeedback}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
