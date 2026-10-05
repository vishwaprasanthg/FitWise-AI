import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Smile, 
  Zap, 
  ThumbsUp, 
  Award,
  RefreshCw
} from 'lucide-react';

export const WorkoutFinishModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  saving, 
  durationMinutes, 
  totalVolumeKg, 
  totalSetsCompleted, 
  exerciseCount,
  workoutTitle
}) => {
  const [feelingRating, setFeelingRating] = useState(4);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const feelingOptions = [
    { value: 1, label: 'Exhausted', icon: '😫' },
    { value: 2, label: 'Tough', icon: '😓' },
    { value: 3, label: 'Solid', icon: '👍' },
    { value: 4, label: 'Great', icon: '⚡' },
    { value: 5, label: 'Crushed It!', icon: '🔥' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      feelingRating,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-dark-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-500/25 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Workout Completed!</h2>
          <p className="text-xs text-slate-400">
            Outstanding effort on <strong className="text-slate-200">{workoutTitle}</strong>.
          </p>
        </div>

        {/* Stats Summary Matrix */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-dark-950 border border-dark-800 rounded-2xl p-4 text-center space-y-1">
            <Clock className="w-4 h-4 text-brand-400 mx-auto" />
            <div className="text-xs text-slate-500 font-semibold uppercase">Duration</div>
            <div className="text-base font-extrabold text-white">{durationMinutes}m</div>
          </div>

          <div className="bg-dark-950 border border-dark-800 rounded-2xl p-4 text-center space-y-1">
            <Flame className="w-4 h-4 text-brand-400 mx-auto" />
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Volume</div>
            <div className="text-base font-extrabold text-brand-400">
              {totalVolumeKg >= 1000 ? `${(totalVolumeKg / 1000).toFixed(1)}k` : totalVolumeKg} kg
            </div>
          </div>

          <div className="bg-dark-950 border border-dark-800 rounded-2xl p-4 text-center space-y-1">
            <Layers className="w-4 h-4 text-brand-400 mx-auto" />
            <div className="text-xs text-slate-500 font-semibold uppercase">Sets Done</div>
            <div className="text-base font-extrabold text-white">{totalSetsCompleted}</div>
          </div>
        </div>

        {/* Post-Workout Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">How did the session feel?</label>
            <div className="grid grid-cols-5 gap-2">
              {feelingOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setFeelingRating(opt.value)}
                  className={`py-2.5 px-1 rounded-xl border text-center transition ${
                    feelingRating === opt.value
                      ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-lg mb-0.5">{opt.icon}</div>
                  <div className="text-[10px] font-semibold truncate">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Workout Notes (Optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bench press felt explosive today, increased weight on dumbbell rows..."
              className="w-full px-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center justify-center space-x-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Logging Workout to MongoDB...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Workout & View Summary</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
