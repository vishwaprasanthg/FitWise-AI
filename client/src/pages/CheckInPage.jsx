import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  Sparkles,
  Activity,
  Heart,
  Scale,
  Smile,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Trophy,
  History,
  Info,
  ShieldAlert,
  Flame,
  Dumbbell
} from 'lucide-react';

export const CheckInPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    currentWeight: user?.profile?.weight || 70,
    adherenceScore: 4,
    energyRating: 4,
    sorenessLevel: 2,
    userFeedback: '',
    autoApplyAdjustments: true,
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // Adherence options
  const adherenceOptions = [
    { value: 1, label: '<40% Completed', desc: 'Missed majority of sessions' },
    { value: 2, label: '50-60% Completed', desc: 'Completed half of scheduled workouts' },
    { value: 3, label: '70-80% Completed', desc: 'Missed only 1 session' },
    { value: 4, label: '90-100% Completed', desc: 'Completed nearly all workouts' },
    { value: 5, label: '100%+ Crushed It', desc: 'Completed every single session + extra' },
  ];

  // Energy options
  const energyOptions = [
    { value: 1, label: 'Drained / Exhausted', emoji: '🪫' },
    { value: 2, label: 'Low Energy', emoji: '🥱' },
    { value: 3, label: 'Moderate Energy', emoji: '⚡' },
    { value: 4, label: 'High Energy', emoji: '🔋' },
    { value: 5, label: 'Peak / Unstoppable', emoji: '🚀' },
  ];

  // Soreness options
  const sorenessOptions = [
    { value: 1, label: 'Fully Fresh', desc: 'No muscle tightness or aches', emoji: '🟢' },
    { value: 2, label: 'Mild Tightness', desc: 'Normal training feel', emoji: '🟡' },
    { value: 3, label: 'Moderate Soreness', desc: 'Noticeable DOMS but functional', emoji: '🟠' },
    { value: 4, label: 'High Soreness', desc: 'Restricted range of motion', emoji: '🔴' },
    { value: 5, label: 'Severe Soreness', desc: 'Significant muscular pain', emoji: '🚨' },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/check-ins', formData);
      if (res && res.success && res.data?.checkIn) {
        setReport(res.data.checkIn);
        if (refreshUser) refreshUser();
      } else {
        setError(res.message || 'Check-in evaluation failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during AI coaching check-in');
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = {
    progressive_overload: 'Progressive Overload Target Applied',
    increase_volume: 'Volume Scaled (+1 Work Set)',
    increase_intensity: 'Load Intensity Bumped (+2.5kg)',
    deload: 'Active Deload Scheduled (Recovery Phase)',
    maintain: 'Routine Baseline Maintained',
    adjust_exercises: 'Exercise Variations Refreshed',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive AI Coaching Loop</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Weekly Athlete Check-in
            </h1>
            <p className="text-xs text-slate-400">
              Evaluate recovery, adapt your active routine, and program next week's progressive overload.
            </p>
          </div>

          <Link
            to="/check-in/history"
            className="px-4 py-2 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>Check-in History</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING EVALUATION STATE */}
        {loading && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">FitPilot AI Coach is Analyzing Your Data...</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Synthesizing training volume, recovery scores, subjective fatigue, and computing overload adjustments.
              </p>
            </div>
          </div>
        )}

        {/* RESULT REPORT VIEW */}
        {!loading && report && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            {/* Header & Recovery Score Gauge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-dark-800 pb-6 text-center sm:text-left">
              <div>
                <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
                  AI Coaching Decision Report
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2">
                  Weekly Assessment Complete
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Evaluated on {new Date(report.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Recovery Score Radial Badge */}
              <div className="flex items-center gap-4 bg-dark-950 p-4 rounded-2xl border border-dark-800">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Recovery Score</div>
                  <div className={`text-3xl font-black ${
                    report.recoveryScore >= 75
                      ? 'text-emerald-400'
                      : report.recoveryScore >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {report.recoveryScore}%
                  </div>
                </div>
                <div className="text-left border-l border-dark-800 pl-3">
                  <div className="text-xs font-bold text-white">{report.aiCoachFeedback?.recoveryGrade}</div>
                  <div className="text-[10px] text-slate-400">
                    {report.recoveryScore >= 75 ? 'Prime for Overload' : report.recoveryScore >= 50 ? 'Steady Capacity' : 'High Fatigue'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Badge */}
            <div className="p-4 bg-brand-500/10 border border-brand-500/25 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-500/20 rounded-xl text-brand-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Action Prescribed</div>
                  <div className="text-sm font-bold text-white">
                    {actionLabels[report.aiCoachFeedback?.recommendedAction] || report.aiCoachFeedback?.recommendedAction}
                  </div>
                </div>
              </div>
              {report.isPlanUpdated && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-full">
                  Active Routine Updated
                </span>
              )}
            </div>

            {/* Coach Analysis Details */}
            <div className="space-y-4">
              <div className="p-5 bg-dark-950 rounded-2xl border border-dark-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-brand-400" />
                  <span>Coach Volume & Recovery Analysis</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.aiCoachFeedback?.analysisSummary}
                </p>
              </div>

              <div className="p-5 bg-dark-950 rounded-2xl border border-dark-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  <span>Next Week Overload Instructions</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.aiCoachFeedback?.progressionNotes}
                </p>
              </div>

              {report.aiCoachFeedback?.planAdjustmentsSummary && (
                <div className="p-4 bg-dark-850 rounded-2xl border border-dark-700 text-xs text-slate-300 space-y-1">
                  <strong className="text-white">Plan Adjustments: </strong>
                  <span>{report.aiCoachFeedback.planAdjustmentsSummary}</span>
                </div>
              )}
            </div>

            {/* Action Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  setReport(null);
                  setStep(1);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-dark-700 transition"
              >
                Submit New Assessment
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/workouts"
                  className="w-full sm:w-auto px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition text-center flex items-center justify-center gap-2"
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>View Updated Workout Plan</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 4-STEP WIZARD FORM */}
        {!loading && !report && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Step Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Step {step} of 4: {
                  step === 1 ? 'Body Weight' :
                  step === 2 ? 'Training Adherence' :
                  step === 3 ? 'Energy & Fatigue' :
                  'Coach Feedback & Auto-Adaptation'
                }</span>
                <span className="text-brand-400 font-bold">{step * 25}%</span>
              </div>
              <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full transition-all duration-300"
                  style={{ width: `${step * 25}%` }}
                />
              </div>
            </div>

            {/* STEP 1: WEIGHT UPDATE */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Current Body Weight</h3>
                  <p className="text-xs text-slate-400">
                    Weigh-in update to calibrate caloric pacing and bodyweight exercise scaling.
                  </p>
                </div>

                <div className="max-w-xs space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Weight in Kilograms (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="300"
                      value={formData.currentWeight}
                      onChange={(e) =>
                        setFormData({ ...formData, currentWeight: parseFloat(e.target.value) || 70 })
                      }
                      className="w-full pl-4 pr-12 py-3 bg-dark-950 border border-dark-800 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-brand-500"
                    />
                    <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-bold">KG</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TRAINING ADHERENCE */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Past Week Training Adherence</h3>
                  <p className="text-xs text-slate-400">
                    How closely did you follow your scheduled training sessions?
                  </p>
                </div>

                <div className="space-y-2">
                  {adherenceOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, adherenceScore: opt.value })}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                        formData.adherenceScore === opt.value
                          ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                          : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white hover:border-dark-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{opt.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </div>
                      {formData.adherenceScore === opt.value && (
                        <CheckCircle2 className="w-5 h-5 text-brand-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: ENERGY & MUSCLE SORENESS */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Energy Level */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Overall Energy & Sleep Quality
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {energyOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, energyRating: opt.value })}
                        className={`p-3 rounded-2xl border text-center transition ${
                          formData.energyRating === opt.value
                            ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                            : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xl mb-1">{opt.emoji}</div>
                        <div className="text-[10px] font-bold line-clamp-1">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soreness Level */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Systemic Muscle Soreness / Joint Fatigue
                  </label>
                  <div className="space-y-2">
                    {sorenessOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, sorenessLevel: opt.value })}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          formData.sorenessLevel === opt.value
                            ? 'bg-brand-500/15 border-brand-500 text-white'
                            : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{opt.emoji}</span>
                          <div>
                            <span className="text-xs font-bold text-white">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({opt.desc})</span>
                          </div>
                        </div>
                        {formData.sorenessLevel === opt.value && (
                          <CheckCircle2 className="w-4 h-4 text-brand-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: NOTES & AUTO-ADAPTATION */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Subjective Notes & Routine Calibration</h3>
                  <p className="text-xs text-slate-400">
                    Share any exercise difficulties, joint tweaks, or areas where you felt ready to push harder.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Athlete Notes (Optional)</label>
                  <textarea
                    rows={4}
                    value={formData.userFeedback}
                    onChange={(e) => setFormData({ ...formData, userFeedback: e.target.value })}
                    placeholder="e.g. Bench press felt explosive this week, increased reps easily. Need to watch right shoulder fatigue on lateral raises."
                    className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Auto Adaptation Toggle */}
                <div className="p-4 bg-dark-950 border border-dark-800 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">Auto-Apply Plan Adaptations</div>
                    <div className="text-[11px] text-slate-400">
                      Automatically update exercise sets, reps, and target loads on your active workout plan.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoApplyAdjustments}
                    onChange={(e) =>
                      setFormData({ ...formData, autoApplyAdjustments: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-950"
                  />
                </div>
              </div>
            )}

            {/* Form Nav Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-dark-700 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Weekly Check-in</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
