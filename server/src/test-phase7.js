const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');
const WorkoutPlan = require('./models/workoutPlan.model');
const WorkoutLog = require('./models/workoutLog.model');
const CheckIn = require('./models/checkIn.model');
const MealPlan = require('./models/mealPlan.model');
const ChatMessage = require('./models/chatMessage.model');

async function runPhase7Tests() {
  console.log('--- STARTING PHASE 7 AI CHAT COACH (COACH PULSE) TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 7 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const user1Email = `fitpilot_chat_1_${Date.now()}@example.com`;
  const user2Email = `fitpilot_chat_2_${Date.now()}@example.com`;
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  try {
    // 1. Setup User 1 with complete ecosystem
    console.log('\n[Setup] Setting up User 1 with complete fitness & nutrition ecosystem...');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Marcus Aurelius', email: user1Email, password: 'Password123!' }),
    });
    const reg1Json = await reg1Res.json();
    user1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0];
    user1Id = reg1Json.data.user._id;

    // Onboarding
    await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        age: 32,
        gender: 'male',
        height: 185,
        weight: 88,
        fitnessLevel: 'advanced',
        primaryGoal: 'strength',
        workoutDaysPerWeek: 5,
        preferredWorkoutDuration: 60,
        equipment: ['dumbbells', 'barbell', 'bench', 'pull-up bar'],
      }),
    });

    // Generate Workout Plan
    const planRes = await fetch(`${baseUrl}/workouts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ splitPreference: 'Push / Pull / Legs Split' }),
    });
    const planJson = await planRes.json();

    // Log Workout
    await fetch(`${baseUrl}/workout-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        workoutPlanId: planJson.data.plan._id,
        workoutDayName: 'Day 1 - Push Focus',
        durationMinutes: 50,
        feelingRating: 4,
        exercises: [{ name: 'Barbell Bench Press', sets: [{ setNumber: 1, actualReps: 5, weightKg: 100, completed: true }] }],
      }),
    });

    // Submit Check-in
    await fetch(`${baseUrl}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        currentWeight: 88,
        adherenceScore: 5,
        energyRating: 4,
        sorenessLevel: 2,
        userFeedback: 'Feeling powerful on heavy presses',
      }),
    });

    // Generate Meal Plan
    await fetch(`${baseUrl}/nutrition/meal-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ dietaryPreference: 'omnivore' }),
    });
    console.log('User 1 full context setup completed.');

    // 2. Test Zod Validation: Reject empty message
    console.log('\n[Test 1] Validation: Reject empty message');
    const emptyMsgRes = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ content: '' }),
    });
    console.log(`Status: ${emptyMsgRes.status} (Expected: 400)`);
    if (emptyMsgRes.status !== 400) {
      throw new Error('Chat endpoint should reject empty message content');
    }

    // 3. Send Exercise Substitution Message
    console.log('\n[Test 2] Send Message: Exercise Substitution Inquiry');
    const msg1Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        content: 'Suggest a substitute for Barbell Bench Press using my dumbbells.',
      }),
    });
    const msg1Json = await msg1Res.json();
    console.log(`Status: ${msg1Res.status} (Expected: 200)`);
    console.log('Assistant Reply Preview:', msg1Json.data?.assistantMessage?.content?.slice(0, 140), '...');
    console.log('Context Telemetry:', msg1Json.data?.contextSummary);

    if (
      msg1Res.status !== 200 ||
      !msg1Json.data?.assistantMessage?.content ||
      !msg1Json.data?.userMessage?._id
    ) {
      throw new Error('Failed to send or process chat message');
    }

    // 4. Send Nutrition Query & Multi-turn Message History
    console.log('\n[Test 3] Send Message 2: Pre-Workout Nutrition & Caloric Guidance');
    const msg2Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        content: 'What should I eat for my pre-workout meal to hit my daily calories?',
      }),
    });
    const msg2Json = await msg2Res.json();
    console.log(`Status: ${msg2Res.status} (Expected: 200)`);
    console.log('Assistant Reply 2 Preview:', msg2Json.data?.assistantMessage?.content?.slice(0, 140), '...');

    // 5. Fetch Full Chat History
    console.log('\n[Test 4] Retrieve Chat History');
    const historyRes = await fetch(`${baseUrl}/chat`, {
      headers: { Cookie: user1Cookie },
    });
    const historyJson = await historyRes.json();
    console.log(`Messages Count: ${historyJson.data?.messages?.length} (Expected: 4)`);
    if (historyJson.data?.messages?.length !== 4) {
      throw new Error('Chat history count mismatch');
    }

    // 6. Clear Chat History
    console.log('\n[Test 5] Clear Chat History');
    const clearRes = await fetch(`${baseUrl}/chat`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie },
    });
    const clearJson = await clearRes.json();
    console.log(`Clear Status: ${clearRes.status} (Expected: 200)`);

    const emptyHistoryRes = await fetch(`${baseUrl}/chat`, {
      headers: { Cookie: user1Cookie },
    });
    const emptyHistoryJson = await emptyHistoryRes.json();
    console.log(`Post-clear Count: ${emptyHistoryJson.data?.messages?.length} (Expected: 0)`);
    if (emptyHistoryJson.data?.messages?.length !== 0) {
      throw new Error('Chat history was not cleared');
    }

    // 7. Security & User Isolation: User 2 cannot access User 1 chat
    console.log('\n[Test 6] Security & Isolation: User 2 cannot access User 1 messages');
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Spy Athlete', email: user2Email, password: 'Password123!' }),
    });
    const reg2Json = await reg2Res.json();
    user2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0];
    user2Id = reg2Json.data.user._id;

    // Send a message as User 1
    await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ content: 'Confidential workout question from User 1' }),
    });

    // User 2 fetches history -> must receive 0 messages
    const user2HistoryRes = await fetch(`${baseUrl}/chat`, {
      headers: { Cookie: user2Cookie },
    });
    const user2HistoryJson = await user2HistoryRes.json();
    console.log(`User 2 history count: ${user2HistoryJson.data?.messages?.length} (Expected: 0)`);
    if (user2HistoryJson.data?.messages?.length !== 0) {
      throw new Error('User 2 should not see User 1 messages');
    }

    // Cleanup test data
    await ChatMessage.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await MealPlan.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await CheckIn.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await WorkoutLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await WorkoutPlan.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    console.log('\nTest data cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 7 AI CHAT COACH (COACH PULSE) TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 7 Test Failed:', err);
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

runPhase7Tests();
