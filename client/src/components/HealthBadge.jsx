import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';

export const HealthBadge = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/health');
      if (res && res.success) {
        setStatus(res.data);
      } else {
        setError('Unexpected response format');
      }
    } catch (err) {
      setError(err.message || 'API connection failed');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Backend Gateway & DB Health</h3>
            <p className="text-xs text-slate-400">Live API Health Probe (/api/health)</p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="p-2 hover:bg-dark-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1 text-xs"
          title="Refresh health status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !status && (
        <div className="flex items-center space-x-2 text-slate-400 text-sm py-2">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
          <span>Checking server connectivity...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Backend Offline or Unreachable</p>
            <p className="text-slate-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {status && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs p-2.5 bg-dark-850 rounded-lg border border-dark-800">
            <span className="text-slate-400">API Status</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {status.service} Online (v{status.version})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 bg-dark-850 rounded-lg border border-dark-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" /> Database Status
            </span>
            <span className={`font-medium ${status.database?.isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {status.database?.isConnected ? 'MongoDB Connected' : `State: ${status.database?.state || 'Disconnected'}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Uptime: {Math.floor(status.uptime || 0)}s</span>
            <span>Env: {status.environment}</span>
          </div>
        </div>
      )}
    </div>
  );
};
