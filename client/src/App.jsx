import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { ProfilePage } from './pages/ProfilePage';
import { WorkoutPlanPage } from './pages/WorkoutPlanPage';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage';
import { WorkoutHistoryPage } from './pages/WorkoutHistoryPage';
import { CheckInPage } from './pages/CheckInPage';
import { CheckInHistoryPage } from './pages/CheckInHistoryPage';
import { MealPlanPage } from './pages/MealPlanPage';
import { GroceryListPage } from './pages/GroceryListPage';
import { ChatCoachPage } from './pages/ChatCoachPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-dark-950 text-white flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Root Route -> Auto-directs to Dashboard / Login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/exercises" element={<ExerciseLibraryPage />} />

                {/* Protected Core Features */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingWizard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workouts"
                  element={
                    <ProtectedRoute>
                      <WorkoutPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workout/active"
                  element={
                    <ProtectedRoute>
                      <ActiveWorkoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workout/history"
                  element={
                    <ProtectedRoute>
                      <WorkoutHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/check-in"
                  element={
                    <ProtectedRoute>
                      <CheckInPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/check-in/history"
                  element={
                    <ProtectedRoute>
                      <CheckInHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/nutrition"
                  element={
                    <ProtectedRoute>
                      <MealPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/nutrition/grocery"
                  element={
                    <ProtectedRoute>
                      <GroceryListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatCoachPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
