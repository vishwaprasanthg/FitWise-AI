const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');
const WorkoutPlan = require('./models/workoutPlan.model');
const WorkoutLog = require('./models/workoutLog.model');
const CheckIn = require('./models/checkIn.model');

async function runPhase5Tests() {
  console.log('--- STARTING PHASE 5 AI COACHING LOOP & ADAPTIVE PROGRESSION TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 5 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const user1Email = `fitpilot_coach_1_${Date.now()}@example.com`;
  const user2Email = `fitpilot_coach_2_${Date.now()}@example.com`;
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;
  let activePlanId = null;
  let checkIn1Id = null;

  try {
    // 1. Setup User 1 with active plan and logged workout
    console.log('\n[Setup] Setting up User 1 with active workout plan & logged volume...');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Leonidas of Sparta', email: user1Email, password: 'Password123!' }),
    });
    const reg1Json = await reg1Res.json();
    user1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0];
    user1Id = reg1Json.data.user._id;

    // Complete Onboarding
    await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        age: 30,
        gender: 'male',
        height: 182,
        weight: 85,
        fitnessLevel: 'intermediate',
        primaryGoal: 'strength',
        workoutDaysPerWeek: 4,
        preferredWorkoutDuration: 45,
        equipment: ['dumbbells', 'barbell', 'bench'],
      }),
    });

    // Generate Active Workout Plan
    const planRes = await fetch(`${baseUrl}/workouts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ splitPreference: 'Upper / Lower Split' }),
    });
    const planJson = await planRes.json();
    activePlanId = planJson.data.plan._id;

    // Log a completed workout
    await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        workoutPlanId: activePlanId,
        workoutDayName: 'Day 1 - Upper Body (Strength)',
        durationMinutes: 45,
        feelingRating: 5,
        exercises: [
          {
            name: 'Barbell Bench Press',
            sets: [{ setNumber: 1, actualReps: 5, weightKg: 80, completed: true }],
          },
        ],
      }),
    });
    console.log('User 1 setup complete with active plan and workout log.');

    // 2. Test Zod Validation: Reject invalid adherence score (>5)
    console.log('\n[Test 1] Validation: Reject check-in with adherenceScore = 10');
    const badCheckInRes = await fetch(`${baseUrl}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        adherenceScore: 10,
        energyRating: 4,
        sorenessLevel: 2,
      }),
    });
    const badCheckInJson = await badCheckInRes.json();
    console.log(`Status: ${badCheckInRes.status} (Expected: 400)`);
    if (badCheckInRes.status !== 400 || badCheckInJson.success !== false) {
      throw new Error('Check-in validation should reject adherenceScore > 5');
    }

    // 3. Submit Optimal Weekly Check-in (Overload expected)
    console.log('\n[Test 2] Submit Weekly Check-in: Energy=5, Soreness=1, Adherence=5, Weight=84.5kg');
    const checkInPayload = {
      currentWeight: 84.5,
      adherenceScore: 5,
      energyRating: 5,
      sorenessLevel: 1, // Energy: 5*8=40, Freshness: (6-1)*8=40, Adherence: 5*4=20 -> Total 100%
      userFeedback: 'Bench press felt easy, completed all scheduled sets with energy to spare.',
      autoApplyAdjustments: true,
    };

    const checkInRes = await fetch(`${baseUrl}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify(checkInPayload),
    });
    const checkInJson = await checkInRes.json();
    console.log(`Status: ${checkInRes.status} (Expected: 201)`);
    console.log('Recovery Score:', checkInJson.data?.checkIn?.recoveryScore, '% (Expected: 100)');
    console.log('Recommended Action:', checkInJson.data?.checkIn?.aiCoachFeedback?.recommendedAction);
    console.log('Plan Updated:', checkInJson.data?.checkIn?.isPlanUpdated);
    console.log('Analysis Summary:', checkInJson.data?.checkIn?.aiCoachFeedback?.analysisSummary);

    if (
      checkInRes.status !== 201 ||
      !checkInJson.success ||
      checkInJson.data?.checkIn?.recoveryScore !== 100 ||
      checkInJson.data?.checkIn?.isPlanUpdated !== true
    ) {
      throw new Error('Check-in submission or recovery computation failed');
    }
    checkIn1Id = checkInJson.data.checkIn._id;

    // Verify User weight was updated in Profile
    const profileRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Cookie: user1Cookie },
    });
    const profileJson = await profileRes.json();
    console.log('Updated Profile Weight:', profileJson.data?.user?.profile?.weight, 'kg (Expected: 84.5)');
    if (profileJson.data?.user?.profile?.weight !== 84.5) {
      throw new Error('User profile weight was not updated during check-in');
    }

    // Verify Active Plan was adapted
    const updatedPlanRes = await fetch(`${baseUrl}/workouts/active`, {
      headers: { Cookie: user1Cookie },
    });
    const updatedPlanJson = await updatedPlanRes.json();
    console.log('Adapted Plan Summary:', updatedPlanJson.data?.plan?.summary);

    // 4. Test High Fatigue / Deload Trigger
    console.log('\n[Test 3] Fatigue Check-in: Energy=1, Soreness=5 -> Trigger Deload');
    const deloadRes = await fetch(`${baseUrl}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        currentWeight: 84.5,
        adherenceScore: 3,
        energyRating: 1,
        sorenessLevel: 5, // Energy: 1*8=8, Freshness: (6-5)*8=8, Adherence: 3*4=12 -> Total: 28%
        userFeedback: 'Exhausted this week, joints aching.',
        autoApplyAdjustments: true,
      }),
    });
    const deloadJson = await deloadRes.json();
    console.log(`Status: ${deloadRes.status} (Expected: 201)`);
    console.log('Fatigue Recovery Score:', deloadJson.data?.checkIn?.recoveryScore, '% (Expected: 28)');
    console.log('Fatigue Action:', deloadJson.data?.checkIn?.aiCoachFeedback?.recommendedAction, '(Expected: deload)');
    if (
      deloadRes.status !== 201 ||
      deloadJson.data?.checkIn?.recoveryScore !== 28 ||
      deloadJson.data?.checkIn?.aiCoachFeedback?.recommendedAction !== 'deload'
    ) {
      throw new Error('Fatigue deload detection failed');
    }

    // 5. Retrieve Check-in History & Latest
    console.log('\n[Test 4] History & Latest Retrieval');
    const historyRes = await fetch(`${baseUrl}/check-ins`, {
      headers: { Cookie: user1Cookie },
    });
    const historyJson = await historyRes.json();
    console.log(`History count: ${historyJson.data?.checkIns?.length} (Expected: 2)`);

    const latestRes = await fetch(`${baseUrl}/check-ins/latest`, {
      headers: { Cookie: user1Cookie },
    });
    const latestJson = await latestRes.json();
    console.log(`Latest recovery score: ${latestJson.data?.checkIn?.recoveryScore}%`);

    if (historyJson.data?.checkIns?.length !== 2 || latestJson.data?.checkIn?.recoveryScore !== 28) {
      throw new Error('Check-in history or latest retrieval failed');
    }

    // 6. Security & User Isolation: User 2 cannot access User 1 check-in
    console.log('\n[Test 5] Security & Isolation: User 2 cannot access User 1 check-in reports');
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Two', email: user2Email, password: 'Password123!' }),
    });
    const reg2Json = await reg2Res.json();
    user2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0];
    user2Id = reg2Json.data.user._id;

    const unauthorizedGet = await fetch(`${baseUrl}/check-ins/${checkIn1Id}`, {
      headers: { Cookie: user2Cookie },
    });
    console.log(`Unauthorized Get Status: ${unauthorizedGet.status} (Expected: 404)`);
    if (unauthorizedGet.status !== 404) {
      throw new Error('User 2 should not be able to access User 1 check-in');
    }

    // Cleanup test data
    await CheckIn.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await WorkoutLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await WorkoutPlan.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    console.log('\nTest data cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 5 AI COACHING & CHECK-IN TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 5 Test Failed:', err);
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

runPhase5Tests();
