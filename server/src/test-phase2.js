const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');

async function runPhase2Tests() {
  console.log('--- STARTING PHASE 2 FITNESS ONBOARDING & PROFILE TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 2 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const testEmail = `fitpilot_onboarding_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Sarah Connor';
  let authCookie = null;
  let authToken = null;

  try {
    // 1. Create a fresh test user
    console.log('\n[Setup] Creating test user for Phase 2...');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const regJson = await regRes.json();
    const rawCookie = regRes.headers.get('set-cookie');
    if (rawCookie) {
      authCookie = rawCookie.split(';')[0];
    }
    authToken = regJson.data?.token;

    if (regRes.status !== 201 || !regJson.success) {
      throw new Error(`Failed to create setup user: ${JSON.stringify(regJson)}`);
    }
    console.log('Created user:', regJson.data.user._id);

    // 2. Test Zod Validation: Reject invalid onboarding data (negative age or zero weight)
    console.log('\n[Test 1] Validation: Reject invalid onboarding metrics (age: 5, weight: -10)');
    const badOnboardingRes = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        age: 5,
        gender: 'female',
        height: 168,
        weight: -10,
        fitnessLevel: 'intermediate',
        primaryGoal: 'muscle_gain',
        workoutDaysPerWeek: 4,
        preferredWorkoutDuration: 45,
        equipment: ['dumbbells'],
      }),
    });
    const badOnboardingJson = await badOnboardingRes.json();
    console.log(`Status: ${badOnboardingRes.status} (Expected: 400)`);
    console.log('Validation Error Response:', badOnboardingJson.message);
    if (badOnboardingRes.status !== 400 || badOnboardingJson.success !== false) {
      throw new Error('Onboarding validation should reject invalid numbers');
    }

    // 3. Test Full Onboarding Completion
    console.log('\n[Test 2] Onboarding: Complete multi-step fitness assessment');
    const validOnboardingPayload = {
      name: 'Sarah Connor',
      age: 29,
      gender: 'female',
      height: 172,
      weight: 65,
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      workoutDaysPerWeek: 4,
      preferredWorkoutDuration: 45,
      equipment: ['dumbbells', 'barbell', 'bench', 'pull_up_bar'],
      preferences: {
        preferredExercises: ['Deadlift', 'Pull-ups', 'Overhead Press'],
        dislikedExercises: ['Burpees', 'Lunges'],
        preferredWorkoutStyle: 'Strength & Conditioning',
      },
      nutritionPreferences: {
        dietaryPreference: 'omnivore',
        favoriteFoods: ['Steak', 'Eggs', 'Rice', 'Avocado'],
        dislikedFoods: ['Tofu', 'Mushroom'],
        dietaryRestrictions: ['gluten_free'],
        cookingTimePreference: '15_30_min',
        budgetPreference: 'moderate',
      },
    };

    const onboardingRes = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify(validOnboardingPayload),
    });
    const onboardingJson = await onboardingRes.json();
    console.log(`Status: ${onboardingRes.status} (Expected: 200)`);
    console.log('Onboarding status:', onboardingJson.data?.user?.onboardingCompleted);
    console.log('Saved equipment:', onboardingJson.data?.user?.profile?.equipment);

    if (
      onboardingRes.status !== 200 ||
      !onboardingJson.success ||
      onboardingJson.data?.user?.onboardingCompleted !== true ||
      onboardingJson.data?.user?.profile?.primaryGoal !== 'strength'
    ) {
      throw new Error('Onboarding save failed or returned incorrect data');
    }

    // 4. Test Profile Retrieval (GET /api/users/profile)
    console.log('\n[Test 3] Profile Retrieval: GET /api/users/profile');
    const profileRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Cookie: authCookie },
    });
    const profileJson = await profileRes.json();
    console.log(`Status: ${profileRes.status} (Expected: 200)`);
    console.log('Retrieved profile goal:', profileJson.data?.user?.profile?.primaryGoal);
    console.log('Retrieved favorite foods:', profileJson.data?.user?.profile?.nutritionPreferences?.favoriteFoods);
    if (
      profileRes.status !== 200 ||
      profileJson.data?.user?.profile?.weight !== 65 ||
      profileJson.data?.user?.profile?.equipment?.length !== 4
    ) {
      throw new Error('Profile retrieval failed');
    }

    // 5. Test Profile Updates (PUT /api/users/profile)
    console.log('\n[Test 4] Profile Update: PUT /api/users/profile (Update weight to 64kg & days to 5)');
    const updateProfileRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        weight: 64,
        workoutDaysPerWeek: 5,
      }),
    });
    const updateProfileJson = await updateProfileRes.json();
    console.log(`Status: ${updateProfileRes.status} (Expected: 200)`);
    console.log('Updated weight:', updateProfileJson.data?.user?.profile?.weight);
    console.log('Updated days/week:', updateProfileJson.data?.user?.profile?.workoutDaysPerWeek);
    if (
      updateProfileRes.status !== 200 ||
      updateProfileJson.data?.user?.profile?.weight !== 64 ||
      updateProfileJson.data?.user?.profile?.workoutDaysPerWeek !== 5
    ) {
      throw new Error('Profile update failed');
    }

    // 6. Test Preferences Updates (PUT /api/users/preferences)
    console.log('\n[Test 5] Preferences Update: PUT /api/users/preferences');
    const updatePrefRes = await fetch(`${baseUrl}/users/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        preferences: {
          preferredExercises: ['Squats', 'Deadlift', 'Pull-ups', 'Bench Press'],
        },
        nutritionPreferences: {
          dietaryPreference: 'pescatarian',
          favoriteFoods: ['Salmon', 'Eggs', 'Oats'],
        },
      }),
    });
    const updatePrefJson = await updatePrefRes.json();
    console.log(`Status: ${updatePrefRes.status} (Expected: 200)`);
    console.log('Updated diet type:', updatePrefJson.data?.user?.profile?.nutritionPreferences?.dietaryPreference);
    console.log('Updated exercises:', updatePrefJson.data?.user?.profile?.preferences?.preferredExercises);

    if (
      updatePrefRes.status !== 200 ||
      updatePrefJson.data?.user?.profile?.nutritionPreferences?.dietaryPreference !== 'pescatarian' ||
      updatePrefJson.data?.user?.profile?.preferences?.preferredExercises?.length !== 4
    ) {
      throw new Error('Preferences update failed');
    }

    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    console.log('\nTest user cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 2 ONBOARDING & PROFILE TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 2 Test Failed:', err);
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

runPhase2Tests();
