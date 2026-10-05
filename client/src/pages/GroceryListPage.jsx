import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  ShoppingCart,
  Printer,
  ArrowLeft,
  RefreshCw,
  Utensils,
  Sparkles,
  Layers
} from 'lucide-react';

export const GroceryListPage = () => {
  const [activePlan, setActivePlan] = useState(null);
  const [groceryList, setGroceryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroceryData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/nutrition/meal-plans/active');
        if (res && res.success && res.data?.plan) {
          setActivePlan(res.data.plan);
          setGroceryList(res.data.plan.groceryList || []);
        }
      } catch (err) {
        console.error('Failed to load grocery list:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroceryData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const totalIngredientsCount = groceryList.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 text-white py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/nutrition"
              className="p-2.5 bg-dark-900 hover:bg-dark-850 text-silver-400 hover:text-white rounded-xl border border-dark-800 transition shadow-silver-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Daily Nutrition Ingredients</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Daily Grocery Shopping List
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalIngredientsCount > 0 && (
              <span className="text-xs text-silver-400 font-mono bg-dark-900 border border-dark-800 px-3 py-2 rounded-xl shadow-silver-sm">
                <strong className="text-brand-400">{totalIngredientsCount}</strong> ingredients for today
              </span>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-silver-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-silver-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print List</span>
            </button>
          </div>
        </div>

        {/* GROCERY CATEGORIES */}
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-dark-900 border border-dark-800 rounded-3xl card-silver">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-silver-400 font-medium">Aggregating ingredients from your daily meal plan...</p>
          </div>
        ) : groceryList.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto card-silver">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto shadow-red-sm">
              <Utensils className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-white">No Grocery List Available</h3>
            <p className="text-xs text-silver-400">
              Generate an active daily meal plan to automatically build your organized grocery shopping list.
            </p>
            <Link
              to="/nutrition"
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-red-sm transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Go to Meal Planner</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groceryList.map((category, catIdx) => (
              <div
                key={catIdx}
                className="bg-dark-900 border border-dark-800 rounded-3xl p-6 card-silver space-y-3"
              >
                <div className="flex items-center justify-between border-b border-dark-800 pb-2.5">
                  <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-red-sm" />
                    <span>{category.category}</span>
                  </h3>
                  <span className="text-[11px] text-silver-400 font-mono">
                    {category.items.length} items
                  </span>
                </div>

                <div className="space-y-1.5">
                  {category.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-3 bg-dark-950 rounded-2xl border border-dark-800 flex items-center justify-between shadow-silver-sm"
                    >
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      {item.amount && (
                        <span className="text-[11px] text-silver-400 font-mono flex-shrink-0 ml-2">
                          {item.amount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
