import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, X, Volume2, Bell } from 'lucide-react';

export const RestTimerModal = ({ initialSeconds = 60, isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    if (isOpen) {
      setIsRunning(true);
    }
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playBeep();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Audio chime via Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio fallback silent if browser blocks autoplay
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const setPreset = (sec) => {
    setTotalSeconds(sec);
    setTimeLeft(sec);
    setIsRunning(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-dark-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Rest & Recovery Timer</span>
          </div>
          <h3 className="text-lg font-bold text-white">Catch Your Breath</h3>
        </div>

        {/* Circular Progress & Clock */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG circle progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-dark-800 stroke-current"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-brand-500 stroke-current transition-all duration-1000 ease-linear"
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1">
                {timeLeft === 0 ? 'Ready for Next Set!' : isRunning ? 'Resting...' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-1.5">
          {[30, 45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => setPreset(sec)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                totalSeconds === sec && timeLeft > 0
                  ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setTimeLeft(totalSeconds);
              setIsRunning(false);
            }}
            className="p-3 bg-dark-850 hover:bg-dark-800 border border-dark-700 rounded-xl text-slate-300 hover:text-white transition"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
