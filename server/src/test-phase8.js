const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');
const WorkoutPlan = require('./models/workoutPlan.model');
const WorkoutLog = require('./models/workoutLog.model');
const CheckIn = require('./models/checkIn.model');
const FoodLog = require('./models/foodLog.model');

async function runPhase8Tests() {
  console.log('--- STARTING PHASE 8 ANALYTICS, VISUALIZATIONS & INSIGHTS TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 8 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const user1Email = `fitpilot_analytics_1_${Date.now()}@example.com`;
  const user2Email = `fitpilot_analytics_2_${Date.now()}@example.com`;
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  try {
    // 1. Setup User 1
    console.log('\n[Setup] Setting up User 1 with complete historical volume & PR records...');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alexander The Great', email: user1Email, password: 'Password123!' }),
    });
    const reg1Json = await reg1Res.json();
    user1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0];
    user1Id = reg1Json.data.user._id;

    await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        age: 26,
        gender: 'male',
        height: 178,
        weight: 80,
        fitnessLevel: 'intermediate',
        primaryGoal: 'muscle_gain',
        workoutDaysPerWeek: 4,
        preferredWorkoutDuration: 45,
        equipment: ['dumbbells', 'barbell', 'bench'],
      }),
    });

    // 2. Log 3 Workout Sessions with PR lifts
    // Session 1: Bench Press 80kg x 8 reps -> 1RM ~ 101kg
    await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        workoutDayName: 'Day 1 - Chest & Push',
        durationMinutes: 45,
        feelingRating: 5,
        exercises: [
          {
            name: 'Barbell Bench Press',
            sets: [
              { setNumber: 1, actualReps: 8, weightKg: 80, completed: true },
              { setNumber: 2, actualReps: 8, weightKg: 80, completed: true },
            ],
          },
        ],
      }),
    });

    // Session 2: Squats 100kg x 6 reps -> 1RM ~ 120kg
    await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        workoutDayName: 'Day 2 - Legs & Quads',
        durationMinutes: 50,
        feelingRating: 4,
        exercises: [
          {
            name: 'Barbell Back Squat',
            sets: [
              { setNumber: 1, actualReps: 6, weightKg: 100, completed: true },
            ],
          },
        ],
      }),
    });

    // Session 3: Deadlifts 140kg x 5 reps -> 1RM ~ 163kg
    await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        workoutDayName: 'Day 3 - Back & Pull',
        durationMinutes: 40,
        feelingRating: 5,
        exercises: [
          {
            name: 'Barbell Deadlift',
            sets: [
              { setNumber: 1, actualReps: 5, weightKg: 140, completed: true },
            ],
          },
        ],
      }),
    });

    // 3. Log 2 Check-Ins for weight & recovery trajectory
    await fetch(`${baseUrl}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        currentWeight: 80.5,
        adherenceScore: 4,
        energyRating: 4,
        sorenessLevel: 2,
      }),
    });

    await fetch(`${baseUrl}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        currentWeight: 81.0,
        adherenceScore: 5,
        energyRating: 5,
        sorenessLevel: 1,
      }),
    });
    console.log('User 1 volume & check-in records seeded.');

    // 4. Test Analytics Dashboard Query
    console.log('\n[Test 1] Query Athlete Analytics Dashboard (?timeRange=30d)');
    const dashRes = await fetch(`${baseUrl}/analytics/dashboard?timeRange=30d`, {
      headers: { Cookie: user1Cookie },
    });
    const dashJson = await dashRes.json();
    console.log(`Status: ${dashRes.status} (Expected: 200)`);
    console.log('Lifetime Workouts:', dashJson.data?.kpis?.lifetimeWorkouts, '(Expected: 3)');
    console.log('Range Volume (kg):', dashJson.data?.kpis?.rangeVolumeKg, 'kg');
    console.log('Volume Time Series Points:', dashJson.data?.volumeTimeSeries?.length, '(Expected: 3)');
    console.log('Weight Trend Points:', dashJson.data?.weightTrend?.length, '(Expected: 3: 80, 80.5, 81)');
    console.log('Recovery Trend Points:', dashJson.data?.recoveryTrend?.length, '(Expected: 2)');

    if (
      dashRes.status !== 200 ||
      dashJson.data?.kpis?.lifetimeWorkouts !== 3 ||
      dashJson.data?.volumeTimeSeries?.length !== 3 ||
      dashJson.data?.weightTrend?.length < 3
    ) {
      throw new Error('Analytics dashboard calculations or time-series mismatch');
    }

    // 5. Test Personal Records (PRs) & Estimated 1RM Math
    console.log('\n[Test 2] Query Personal Records & 1RM Math');
    const prRes = await fetch(`${baseUrl}/analytics/personal-records`, {
      headers: { Cookie: user1Cookie },
    });
    const prJson = await prRes.json();
    console.log(`Status: ${prRes.status} (Expected: 200)`);
    console.log('PRs Extracted:', prJson.data?.personalRecords?.map((p) => `${p.exerciseName}: ${p.maxWeightKg}kg (1RM: ${p.estimated1RM}kg)`));

    const deadliftPR = prJson.data?.personalRecords?.find((p) => p.exerciseName === 'Barbell Deadlift');
    const benchPR = prJson.data?.personalRecords?.find((p) => p.exerciseName === 'Barbell Bench Press');

    if (
      prRes.status !== 200 ||
      !deadliftPR ||
      deadliftPR.maxWeightKg !== 140 ||
      deadliftPR.estimated1RM !== 163 ||
      !benchPR ||
      benchPR.maxWeightKg !== 80 ||
      benchPR.estimated1RM !== 101
    ) {
      throw new Error('Personal records extraction or Epley 1RM math failed');
    }

    // 6. Test AI Progress Evaluation Report
    console.log('\n[Test 3] Query AI Progress Insights');
    const insightRes = await fetch(`${baseUrl}/analytics/insights`, {
      headers: { Cookie: user1Cookie },
    });
    const insightJson = await insightRes.json();
    console.log(`Status: ${insightRes.status} (Expected: 200)`);
    console.log('Insight Title:', insightJson.data?.insights?.periodTitle);
    console.log('Overall Grade:', insightJson.data?.insights?.overallGrade);
    console.log('Milestones:', insightJson.data?.insights?.milestones);

    if (
      insightRes.status !== 200 ||
      !insightJson.data?.insights?.summary ||
      !insightJson.data?.insights?.milestones?.length
    ) {
      throw new Error('Athlete insights generation failed');
    }

    // 7. Security & User Isolation: User 2 has isolated analytics
    console.log('\n[Test 4] Security & Isolation: User 2 receives 0 records in fresh account');
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Newbie Athlete', email: user2Email, password: 'Password123!' }),
    });
    const reg2Json = await reg2Res.json();
    user2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0];
    user2Id = reg2Json.data.user._id;

    const user2Dash = await fetch(`${baseUrl}/analytics/dashboard`, {
      headers: { Cookie: user2Cookie },
    });
    const user2Json = await user2Dash.json();
    console.log('User 2 Lifetime Workouts:', user2Json.data?.kpis?.lifetimeWorkouts, '(Expected: 0)');
    console.log('User 2 PRs:', user2Json.data?.personalRecords?.length, '(Expected: 0)');

    if (user2Json.data?.kpis?.lifetimeWorkouts !== 0 || user2Json.data?.personalRecords?.length !== 0) {
      throw new Error('User 2 should not see User 1 analytics');
    }

    // Cleanup test data
    await WorkoutLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await CheckIn.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await FoodLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    console.log('\nTest data cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 8 ANALYTICS & INSIGHTS TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 8 Test Failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (e) {}
    testServer.close(() => {
      process.exit(process.exitCode || 0);
    });
    setTimeout(() => process.exit(process.exitCode || 0), 1500);
  }
}

runPhase8Tests();
