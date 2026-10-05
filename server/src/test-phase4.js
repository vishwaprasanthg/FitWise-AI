const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');
const WorkoutLog = require('./models/workoutLog.model');

async function runPhase4Tests() {
  console.log('--- STARTING PHASE 4 WORKOUT EXECUTION & LOGGING TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 4 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const user1Email = `fitpilot_logger_1_${Date.now()}@example.com`;
  const user2Email = `fitpilot_logger_2_${Date.now()}@example.com`;
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;
  let loggedSession1Id = null;

  try {
    // 1. Setup User 1
    console.log('\n[Setup] Creating User 1 for workout logging...');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alexander the Great', email: user1Email, password: 'Password123!' }),
    });
    const reg1Json = await reg1Res.json();
    user1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0];
    user1Id = reg1Json.data.user._id;

    // 2. Test Zod Validation: Reject invalid duration (<1 min)
    console.log('\n[Test 1] Validation: Reject workout log with duration < 1 min');
    const invalidLogRes = await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        workoutDayName: 'Quick Flash',
        durationMinutes: 0, // Invalid (<1)
        exercises: [
          {
            name: 'Push-ups',
            sets: [{ setNumber: 1, actualReps: 15, weightKg: 0, completed: true }],
          },
        ],
      }),
    });
    const invalidLogJson = await invalidLogRes.json();
    console.log(`Status: ${invalidLogRes.status} (Expected: 400)`);
    if (invalidLogRes.status !== 400 || invalidLogJson.success !== false) {
      throw new Error('Validation should reject duration < 1');
    }

    // 3. Log a complete workout session
    console.log('\n[Test 2] Workout Logging: POST /api/workout-logs (Upper Body Strength)');
    const logPayload = {
      workoutDayName: 'Day 1 - Upper Body Push & Pull',
      durationMinutes: 48,
      feelingRating: 5,
      notes: 'New PR on dumbbell bench press: 30kg for 8 reps!',
      exercises: [
        {
          exerciseId: 'db_bench_press',
          name: 'Dumbbell Bench Press',
          targetMuscle: 'Chest',
          equipment: 'dumbbells, bench',
          sets: [
            { setNumber: 1, targetReps: '8-10 reps', actualReps: 10, weightKg: 26, rpe: 8, completed: true },
            { setNumber: 2, targetReps: '8-10 reps', actualReps: 10, weightKg: 28, rpe: 8.5, completed: true },
            { setNumber: 3, targetReps: '8-10 reps', actualReps: 8, weightKg: 30, rpe: 9.5, completed: true },
          ],
        },
        {
          exerciseId: 'single_arm_db_row',
          name: 'Single-Arm Dumbbell Row',
          targetMuscle: 'Back',
          equipment: 'dumbbells, bench',
          sets: [
            { setNumber: 1, targetReps: '10-12 reps', actualReps: 12, weightKg: 24, rpe: 8, completed: true },
            { setNumber: 2, targetReps: '10-12 reps', actualReps: 12, weightKg: 24, rpe: 8, completed: true },
            { setNumber: 3, targetReps: '10-12 reps', actualReps: 10, weightKg: 26, rpe: 9, completed: true },
          ],
        },
      ],
    };

    // Expected Volume:
    // Bench: (10*26) + (10*28) + (8*30) = 260 + 280 + 240 = 780 kg
    // Row: (12*24) + (12*24) + (10*26) = 288 + 288 + 260 = 836 kg
    // Total Volume = 780 + 836 = 1616 kg
    // Total Sets = 6

    const logRes = await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify(logPayload),
    });
    const logJson = await logRes.json();
    console.log(`Status: ${logRes.status} (Expected: 201)`);
    console.log('Logged Session Title:', logJson.data?.log?.workoutDayName);
    console.log('Calculated Total Volume:', logJson.data?.log?.totalVolumeKg, 'kg (Expected: 1616)');
    console.log('Calculated Sets Done:', logJson.data?.log?.totalSetsCompleted, '(Expected: 6)');

    if (
      logRes.status !== 201 ||
      !logJson.success ||
      logJson.data?.log?.totalVolumeKg !== 1616 ||
      logJson.data?.log?.totalSetsCompleted !== 6
    ) {
      throw new Error('Workout logging failed or volume calculation incorrect');
    }
    loggedSession1Id = logJson.data.log._id;

    // 4. Retrieve Workout History: GET /api/workout-logs
    console.log('\n[Test 3] History Feed: GET /api/workout-logs');
    const historyRes = await fetch(`${baseUrl}/workout-logs`, {
      headers: { Cookie: user1Cookie },
    });
    const historyJson = await historyRes.json();
    console.log(`Status: ${historyRes.status} (Expected: 200)`);
    console.log(`History count: ${historyJson.data?.logs?.length}`);
    if (historyRes.status !== 200 || historyJson.data?.logs?.length !== 1) {
      throw new Error('History feed retrieval failed');
    }

    // 5. Retrieve Aggregate Stats: GET /api/workout-logs/stats
    console.log('\n[Test 4] Aggregate Metrics: GET /api/workout-logs/stats');
    const statsRes = await fetch(`${baseUrl}/workout-logs/stats`, {
      headers: { Cookie: user1Cookie },
    });
    const statsJson = await statsRes.json();
    console.log(`Status: ${statsRes.status} (Expected: 200)`);
    console.log('Total Workouts Logged:', statsJson.data?.stats?.totalWorkouts);
    console.log('Total Volume All-Time:', statsJson.data?.stats?.totalVolumeKg, 'kg');
    console.log('Average Duration:', statsJson.data?.stats?.avgDurationMinutes, 'mins');
    if (
      statsRes.status !== 200 ||
      statsJson.data?.stats?.totalWorkouts !== 1 ||
      statsJson.data?.stats?.totalVolumeKg !== 1616 ||
      statsJson.data?.stats?.avgDurationMinutes !== 48
    ) {
      throw new Error('Aggregate statistics computation incorrect');
    }

    // 6. Retrieve Single Workout Log: GET /api/workout-logs/:id
    console.log('\n[Test 5] Single Log Details: GET /api/workout-logs/:id');
    const singleLogRes = await fetch(`${baseUrl}/workout-logs/${loggedSession1Id}`, {
      headers: { Cookie: user1Cookie },
    });
    const singleLogJson = await singleLogRes.json();
    console.log(`Status: ${singleLogRes.status} (Expected: 200)`);
    console.log('Single Log Notes:', singleLogJson.data?.log?.notes);
    if (singleLogRes.status !== 200 || singleLogJson.data?.log?._id !== loggedSession1Id) {
      throw new Error('Single log retrieval failed');
    }

    // 7. Security & User Isolation: User 2 cannot access or delete User 1's log
    console.log('\n[Test 6] Security & Isolation: User 2 cannot access User 1 logs');
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Two', email: user2Email, password: 'Password123!' }),
    });
    const reg2Json = await reg2Res.json();
    user2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0];
    user2Id = reg2Json.data.user._id;

    const unauthorizedGet = await fetch(`${baseUrl}/workout-logs/${loggedSession1Id}`, {
      headers: { Cookie: user2Cookie },
    });
    console.log(`Unauthorized Get Status: ${unauthorizedGet.status} (Expected: 404)`);
    if (unauthorizedGet.status !== 404) {
      throw new Error('User 2 should not be able to read User 1 log');
    }

    const unauthorizedDelete = await fetch(`${baseUrl}/workout-logs/${loggedSession1Id}`, {
      method: 'DELETE',
      headers: { Cookie: user2Cookie },
    });
    console.log(`Unauthorized Delete Status: ${unauthorizedDelete.status} (Expected: 404)`);
    if (unauthorizedDelete.status !== 404) {
      throw new Error('User 2 should not be able to delete User 1 log');
    }

    // 8. Delete Workout Log: DELETE /api/workout-logs/:id by User 1
    console.log('\n[Test 7] Delete Log: DELETE /api/workout-logs/:id by owner');
    const deleteRes = await fetch(`${baseUrl}/workout-logs/${loggedSession1Id}`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie },
    });
    const deleteJson = await deleteRes.json();
    console.log(`Status: ${deleteRes.status} (Expected: 200)`);
    if (deleteRes.status !== 200 || !deleteJson.success) {
      throw new Error('Owner failed to delete workout log');
    }

    // Cleanup test users
    await WorkoutLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    console.log('\nTest data cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 4 WORKOUT LOGGING TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 4 Test Failed:', err);
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

runPhase4Tests();
