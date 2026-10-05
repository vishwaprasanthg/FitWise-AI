import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  MessageSquare,
  Sparkles,
  Send,
  Trash2,
  Activity,
  Target,
  Flame,
  Utensils,
  Dumbbell,
  ShieldCheck,
  RefreshCw,
  User,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';

export const ChatCoachPage = () => {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [contextData, setContextData] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistoryAndContext = async () => {
    try {
      const [chatRes, targetRes, planRes, checkInRes] = await Promise.all([
        apiClient.get('/chat'),
        apiClient.get('/nutrition/targets'),
        apiClient.get('/workouts/active'),
        apiClient.get('/check-ins/latest'),
      ]);

      if (chatRes && chatRes.success && chatRes.data?.messages) {
        setMessages(chatRes.data.messages);
      }

      setContextData({
        targets: targetRes?.data?.targets || null,
        activePlan: planRes?.data?.plan || null,
        latestCheckIn: checkInRes?.data?.checkIn || null,
      });
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistoryAndContext();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || !text.trim() || loading) return;

    const userMessageDraft = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessageDraft]);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiClient.post('/chat', { content: text });
      if (res && res.success && res.data) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== userMessageDraft._id),
          res.data.userMessage,
          res.data.assistantMessage,
        ]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await apiClient.delete('/chat');
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const quickPrompts = [
    { title: 'Exercise Swap', text: 'Suggest a substitute for Barbell Bench Press matching my equipment.' },
    { title: 'Pre-Workout Fuel', text: 'What should I eat before today’s scheduled workout session?' },
    { title: 'Recovery Check', text: 'My lower back feels tight today, what exercises should I modify?' },
    { title: 'Overload Strategy', text: 'How do I safely increase my squat load next week?' },
  ];

  // Helper to render basic markdown format (bold, bullet points, headers)
  const renderMessageContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-white mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start space-x-1.5 text-xs text-slate-300 my-0.5">
            <span className="text-brand-400 font-bold">&bull;</span>
            <span>{line.replace(/^[-*]\s/, '')}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="text-xs text-slate-300 my-0.5 pl-2">
            {line}
          </div>
        );
      }
      return (
        <p key={idx} className="text-xs leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 flex flex-col lg:flex-row">
      {/* LEFT SIDEBAR: ATHLETE HUD CONTEXT */}
      <div className="w-full lg:w-80 bg-dark-900 border-r border-dark-800 p-6 space-y-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Coach Pulse</h2>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online & Context-Synced</span>
            </div>
          </div>
        </div>

        {/* Live Context Telemetry */}
        <div className="space-y-3 text-xs">
          <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            Live Athlete Context
          </div>

          <div className="bg-dark-950 p-3.5 rounded-2xl border border-dark-800 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
              <span>Primary Goal</span>
              <Target className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="font-bold text-white capitalize">
              {user?.profile?.primaryGoal?.replace('_', ' ') || 'Muscle Gain'}
            </div>
            <div className="text-[10px] text-slate-400">
              Level: {user?.profile?.fitnessLevel || 'Intermediate'} &bull; {user?.profile?.weight || 70}kg
            </div>
          </div>

          <div className="bg-dark-950 p-3.5 rounded-2xl border border-dark-800 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
              <span>Readiness & Recovery</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-bold text-white">
              {contextData?.latestCheckIn ? `${contextData.latestCheckIn.recoveryScore}% (${contextData.latestCheckIn.aiCoachFeedback?.recoveryGrade || 'Optimal'})` : '85% (Optimal Readiness)'}
            </div>
            <div className="text-[10px] text-slate-400">
              Action: {contextData?.latestCheckIn?.aiCoachFeedback?.recommendedAction?.replace('_', ' ') || 'Progressive Overload'}
            </div>
          </div>

          <div className="bg-dark-950 p-3.5 rounded-2xl border border-dark-800 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
              <span>Active Program</span>
              <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="font-bold text-white line-clamp-1">
              {contextData?.activePlan?.title || 'No active routine'}
            </div>
          </div>

          <div className="bg-dark-950 p-3.5 rounded-2xl border border-dark-800 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
              <span>Daily Nutrition Target</span>
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-bold text-white">
              {contextData?.targets?.targetDailyCalories || 2400} kcal
            </div>
            <div className="text-[10px] text-slate-400">
              Protein Target: {contextData?.targets?.targetMacros?.proteinGrams || 160}g
            </div>
          </div>
        </div>

        {/* Clear Chat Button */}
        <button
          onClick={handleClearHistory}
          className="w-full py-2.5 px-4 bg-dark-950 hover:bg-dark-850 border border-dark-800 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Conversation</span>
        </button>
      </div>

      {/* RIGHT MAIN: CHAT INTERACTION COCKPIT */}
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {/* Welcome Intro */}
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4 max-w-lg mx-auto animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/10">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Welcome, athlete {user?.name}!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I'm <strong>Coach Pulse</strong>. I have full real-time access to your workout routine, recent volume, recovery metrics, and nutritional targets. Ask me anything or select a prompt below.
                </p>
              </div>

              {/* Quick Action Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 text-left">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="p-3.5 bg-dark-900 hover:bg-dark-850 border border-dark-800 hover:border-brand-500/40 rounded-2xl transition group text-left"
                  >
                    <div className="text-[11px] font-bold text-brand-400 group-hover:text-brand-300">
                      {p.title}
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                      {p.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg._id || idx}
                className={`flex items-start gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                } animate-fadeIn`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isUser
                      ? 'bg-brand-500 text-white'
                      : 'bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-md'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-3xl text-xs space-y-1 shadow-lg ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-dark-900 border border-dark-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>{renderMessageContent(msg.content)}</div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? 'text-brand-200' : 'text-slate-500'
                    }`}
                  >
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-center space-x-2 mr-auto bg-dark-900 border border-dark-800 p-3 rounded-2xl animate-pulse">
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Coach Pulse is formulating biomechanical advice...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM COCKPIT */}
        <div className="p-4 bg-dark-900 border-t border-dark-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Coach Pulse about technique, substitutions, meal ideas, or recovery..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-dark-950 border border-dark-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 text-white rounded-2xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
