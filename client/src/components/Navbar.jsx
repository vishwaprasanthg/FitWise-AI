import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, LogOut, User as UserIcon, LayoutDashboard, Sparkles, History, Activity, Utensils, Zap, TrendingUp } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/exercises', label: 'Exercises', icon: Sparkles, hideOnMobile: true },
    { to: '/workout/history', label: 'History', icon: History, hideOnMobile: true },
    { to: '/nutrition', label: 'Nutrition', icon: Utensils },
    { to: '/chat', label: 'Coach AI', icon: Zap },
    { to: '/check-in', label: 'Check-in', icon: Activity },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/profile', label: 'Profile', icon: UserIcon, hideOnSmall: true },
  ];

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <header className="border-b border-dark-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-50 shadow-silver-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-red-sm group-hover:scale-105 transition flex-shrink-0">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
            FitPilot <span className="text-brand-400">AI</span>
          </span>
        </Link>

        {/* Navigation Links & Auth Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {isAuthenticated ? (
            <>
              {navItems.map((item) => {
                const active = isNavActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      item.hideOnMobile ? 'hidden md:flex' : item.hideOnSmall ? 'hidden lg:flex' : 'flex'
                    } ${
                      active
                        ? 'text-brand-400 bg-brand-500/10 border border-brand-500/30'
                        : 'text-silver-300 hover:text-white hover:bg-dark-800 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-400' : 'text-silver-400'}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-4 w-px bg-dark-800 mx-1 hidden sm:block" />

              {/* User Pill */}
              <div className="flex items-center space-x-2 bg-dark-850 border border-dark-800 px-2.5 py-1.5 rounded-xl shadow-silver-sm">
                <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-[10px]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-white hidden md:inline">
                  {user?.name}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-brand-500/10 rounded-xl text-silver-400 hover:text-brand-400 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-xs font-bold text-silver-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-dark-850 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white px-4 py-2 rounded-xl shadow-red-sm transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
