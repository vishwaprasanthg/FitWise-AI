const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');
const WorkoutPlan = require('./models/workoutPlan.model');

async function runPhase3Tests() {
  console.log('--- STARTING PHASE 3 FITNESS CORE & AI WORKOUT GENERATION TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 3 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const user1Email = `fitpilot_workout_1_${Date.now()}@example.com`;
  const user2Email = `fitpilot_workout_2_${Date.now()}@example.com`;
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;
  let plan1Id = null;
  let plan2Id = null;

  try {
    // 1. Exercise Catalog Tests (Public/Protected endpoint)
    console.log('\n[Test 1] Exercise Catalog: Search & Filter Repository');
    const catalogRes = await fetch(`${baseUrl}/workouts/exercises?muscleGroup=Chest&equipment=dumbbells`);
    const catalogJson = await catalogRes.json();
    console.log(`Status: ${catalogRes.status} (Expected: 200)`);
    console.log(`Found ${catalogJson.data?.total} chest dumbbell exercises`);
    if (catalogRes.status !== 200 || !catalogJson.data?.exercises?.length) {
      throw new Error('Exercise catalog search failed');
    }

    // 2. Setup User 1 with complete profile
    console.log('\n[Setup] Creating User 1 with Dumbbell + Bench profile...');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Marcus Aurelius', email: user1Email, password: 'Password123!' }),
    });
    const reg1Json = await reg1Res.json();
    user1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0];
    user1Id = reg1Json.data.user._id;

    // Complete User 1 Onboarding
    await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        age: 32,
        gender: 'male',
        height: 180,
        weight: 80,
        fitnessLevel: 'intermediate',
        primaryGoal: 'muscle_gain',
        workoutDaysPerWeek: 4,
        preferredWorkoutDuration: 45,
        equipment: ['dumbbells', 'bench'],
        preferences: {
          preferredExercises: ['Dumbbell Bench Press', 'Dumbbell Bicep Curl'],
          dislikedExercises: ['Burpees'],
          preferredWorkoutStyle: 'Upper / Lower Split',
        },
      }),
    });
    console.log('User 1 profile ready.');

    // 3. Generate AI Workout Plan for User 1 (Uses Profile Stats directly)
    console.log('\n[Test 2] AI Workout Generation (7-Day Schedule): POST /api/workouts/generate');
    const genRes = await fetch(`${baseUrl}/workouts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        customNotes: 'Focus on chest and back density',
      }),
    });
    const genJson = await genRes.json();
    console.log(`Status: ${genRes.status} (Expected: 201)`);
    console.log('Generated Plan Title:', genJson.data?.plan?.title);
    console.log('Plan Schedule Days:', genJson.data?.plan?.schedule?.length);
    console.log('Day 1 Name:', genJson.data?.plan?.schedule?.[0]?.dayName);
    console.log('Current Day Number:', genJson.data?.plan?.currentDayNumber);

    if (
      genRes.status !== 201 ||
      !genJson.success ||
      !genJson.data?.plan?.schedule ||
      genJson.data?.plan?.schedule?.length !== 7 ||
      genJson.data?.plan?.currentDayNumber !== 1 ||
      genJson.data?.plan?.isActive !== true
    ) {
      throw new Error('Workout plan generation failed to produce 7-day schedule');
    }
    plan1Id = genJson.data.plan._id;

    // 4. Retrieve Active Workout Plan: GET /api/workouts/active
    console.log('\n[Test 3] Active Plan Retrieval: GET /api/workouts/active');
    const activeRes = await fetch(`${baseUrl}/workouts/active`, {
      headers: { Cookie: user1Cookie },
    });
    const activeJson = await activeRes.json();
    console.log(`Status: ${activeRes.status} (Expected: 200)`);
    console.log('Active Plan ID:', activeJson.data?.plan?._id);
    if (activeRes.status !== 200 || activeJson.data?.plan?._id !== plan1Id) {
      throw new Error('Active plan retrieval failed');
    }

    // 5. Test 7-Day Day Progression: Mark Day 1 as Completed & Day 2 as Skipped
    console.log('\n[Test 4] 7-Day Day Progression: Mark Day 1 Completed & Day 2 Skipped');
    const day1DoneRes = await fetch(`${baseUrl}/workouts/active/day/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ status: 'completed' }),
    });
    const day1DoneJson = await day1DoneRes.json();
    console.log('Day 1 Status:', day1DoneJson.data?.plan?.schedule?.[0]?.status);
    console.log('Current Day after Day 1 complete:', day1DoneJson.data?.plan?.currentDayNumber);

    if (
      day1DoneRes.status !== 200 ||
      day1DoneJson.data?.plan?.schedule?.[0]?.status !== 'completed' ||
      day1DoneJson.data?.plan?.currentDayNumber !== 2
    ) {
      throw new Error('Failed to mark Day 1 completed or advance current day');
    }

    const day2SkipRes = await fetch(`${baseUrl}/workouts/active/day/2/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ status: 'skipped' }),
    });
    const day2SkipJson = await day2SkipRes.json();
    console.log('Day 2 Status:', day2SkipJson.data?.plan?.schedule?.[1]?.status);
    console.log('Current Day after Day 2 skip:', day2SkipJson.data?.plan?.currentDayNumber);

    if (
      day2SkipRes.status !== 200 ||
      day2SkipJson.data?.plan?.schedule?.[1]?.status !== 'skipped' ||
      day2SkipJson.data?.plan?.currentDayNumber !== 3
    ) {
      throw new Error('Failed to skip Day 2 or advance current day');
    }

    // 6. Test 7-Day Cycle Reset
    console.log('\n[Test 5] Reset 7-Day Cycle: POST /api/workouts/active/reset-cycle');
    const resetRes = await fetch(`${baseUrl}/workouts/active/reset-cycle`, {
      method: 'POST',
      headers: { Cookie: user1Cookie },
    });
    const resetJson = await resetRes.json();
    console.log('Reset Current Day:', resetJson.data?.plan?.currentDayNumber);
    console.log('Day 1 Status Post-Reset:', resetJson.data?.plan?.schedule?.[0]?.status);

    if (
      resetRes.status !== 200 ||
      resetJson.data?.plan?.currentDayNumber !== 1 ||
      resetJson.data?.plan?.schedule?.[0]?.status !== 'pending'
    ) {
      throw new Error('Failed to reset 7-day cycle');
    }

    // 7. Test User Data Isolation (User 2 cannot access User 1's plan)
    console.log('\n[Test 6] Security & Isolation: User 2 cannot access User 1 workout plans');
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Two', email: user2Email, password: 'Password123!' }),
    });
    const reg2Json = await reg2Res.json();
    user2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0];
    user2Id = reg2Json.data.user._id;

    // User 2 tries to GET User 1's plan
    const unauthorizedPlanGet = await fetch(`${baseUrl}/workouts/plans/${plan1Id}`, {
      headers: { Cookie: user2Cookie },
    });
    console.log(`Unauthorized Get Status: ${unauthorizedPlanGet.status} (Expected: 404)`);
    if (unauthorizedPlanGet.status !== 404) {
      throw new Error('User 2 should not be able to access User 1 plan');
    }

    // User 2 tries to update status on non-existent plan
    const unauthorizedStatus = await fetch(`${baseUrl}/workouts/active/day/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ status: 'completed' }),
    });
    console.log(`Unauthorized Status Update: ${unauthorizedStatus.status} (Expected: 404)`);
    if (unauthorizedStatus.status !== 404) {
      throw new Error('User 2 should not be able to update status on empty plan');
    }

    // Cleanup test data
    await WorkoutPlan.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    console.log('\nTest data cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 3 WORKOUT GENERATION TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 3 Test Failed:', err);
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

runPhase3Tests();
