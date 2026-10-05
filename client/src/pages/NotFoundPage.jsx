import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Zap,
  ArrowRight
} from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 flex items-center justify-center p-6">
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 sm:p-12 max-w-lg w-full shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/10">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-black text-white tracking-tight">404</div>
          <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been relocated in the FitPilot AI cockpit.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-left">
          <Link
            to="/dashboard"
            className="p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500/30 rounded-2xl transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <LayoutDashboard className="w-4 h-4 text-brand-400" />
              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-brand-400 transition" />
            </div>
            <div className="text-xs font-bold text-white">Dashboard</div>
            <div className="text-[10px] text-slate-500">Athlete Command</div>
          </Link>

          <Link
            to="/workouts"
            className="p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500/30 rounded-2xl transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <Dumbbell className="w-4 h-4 text-brand-400" />
              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-brand-400 transition" />
            </div>
            <div className="text-xs font-bold text-white">Workouts</div>
            <div className="text-[10px] text-slate-500">AI Plan & Schedule</div>
          </Link>

          <Link
            to="/nutrition"
            className="p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500/30 rounded-2xl transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <Utensils className="w-4 h-4 text-brand-400" />
              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-brand-400 transition" />
            </div>
            <div className="text-xs font-bold text-white">Nutrition</div>
            <div className="text-[10px] text-slate-500">Meal Plan & Grocery</div>
          </Link>

          <Link
            to="/chat"
            className="p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500/30 rounded-2xl transition group space-y-1"
          >
            <div className="flex items-center justify-between">
              <Zap className="w-4 h-4 text-brand-400" />
              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-brand-400 transition" />
            </div>
            <div className="text-xs font-bold text-white">Coach Pulse</div>
            <div className="text-[10px] text-slate-500">AI Chat Assistant</div>
          </Link>
        </div>
      </div>
    </div>
  );
};
