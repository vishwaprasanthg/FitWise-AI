const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/user.model');
const MealPlan = require('./models/mealPlan.model');
const FoodLog = require('./models/foodLog.model');

async function runPhase6Tests() {
  console.log('--- STARTING PHASE 6 DAILY NUTRITION & MEAL PLAN TESTS ---');

  await connectDB();
  const dbConnected = mongoose.connection.readyState === 1;
  console.log(`Database Connection State: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

  if (!dbConnected) {
    throw new Error('Database connection required for Phase 6 tests');
  }

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running on port ${port}`);

  const user1Email = `fitpilot_nutrition_1_${Date.now()}@example.com`;
  const user2Email = `fitpilot_nutrition_2_${Date.now()}@example.com`;
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;
  let mealPlanId = null;

  try {
    // 1. Setup User 1 with Onboarding (Vegetarian)
    console.log('\n[Setup] Setting up User 1 with Vegetarian fitness & nutrition profile...');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Chef Athlete', email: user1Email, password: 'Password123!' }),
    });
    const reg1Json = await reg1Res.json();
    user1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0];
    user1Id = reg1Json.data.user._id;

    await fetch(`${baseUrl}/users/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        age: 28,
        gender: 'male',
        height: 180,
        weight: 80,
        fitnessLevel: 'intermediate',
        primaryGoal: 'muscle_gain',
        workoutDaysPerWeek: 4,
        preferredWorkoutDuration: 45,
        equipment: ['dumbbells', 'barbell', 'bench'],
        nutritionPreferences: {
          dietaryPreference: 'vegetarian',
          mealsPerDay: 4,
          favoriteFoods: ['tofu', 'oats', 'greek yogurt', 'paneer', 'quinoa'],
          dislikedFoods: ['mushrooms'],
          dietaryRestrictions: [],
        },
      }),
    });
    console.log('User 1 setup complete.');

    // 2. Test TDEE & Macro Calculations
    console.log('\n[Test 1] Scientific TDEE & Macro Target Calculation (Mifflin-St Jeor)');
    const targetRes = await fetch(`${baseUrl}/nutrition/targets`, {
      headers: { Cookie: user1Cookie },
    });
    const targetJson = await targetRes.json();
    console.log(`Status: ${targetRes.status} (Expected: 200)`);
    console.log('Target Daily Calories:', targetJson.data?.targets?.targetDailyCalories, 'kcal');
    console.log('Target Macros:', targetJson.data?.targets?.targetMacros);

    if (
      targetRes.status !== 200 ||
      !targetJson.data?.targets?.targetDailyCalories ||
      targetJson.data?.targets?.targetDailyCalories < 2000 ||
      !targetJson.data?.targets?.targetMacros?.proteinGrams
    ) {
      throw new Error('TDEE or macronutrient calculation failed');
    }

    // 3. Generate 1-Day Daily AI Meal Plan for Vegetarian
    console.log('\n[Test 2] Generate 1-Day Daily Vegetarian Meal Plan (Order: Breakfast, Lunch, Snack, Dinner)');
    const genRes = await fetch(`${baseUrl}/nutrition/meal-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        dietaryPreference: 'vegetarian',
        customNotes: 'High protein vegetarian staples',
      }),
    });
    const genJson = await genRes.json();
    console.log(`Status: ${genRes.status} (Expected: 201)`);
    console.log('Meal Plan Title:', genJson.data?.plan?.title);
    const mealTypes = genJson.data?.plan?.days?.[0]?.meals?.map((m) => m.mealType);
    console.log('Meal Order:', mealTypes);
    console.log('Dishes Generated:', genJson.data?.plan?.days?.[0]?.meals?.map((m) => `${m.mealType}: ${m.name}`));

    if (
      genRes.status !== 201 ||
      genJson.data?.plan?.days?.length !== 1 ||
      genJson.data?.plan?.days?.[0]?.meals?.length !== 4 ||
      mealTypes[0] !== 'breakfast' ||
      mealTypes[1] !== 'lunch' ||
      mealTypes[2] !== 'snack' ||
      mealTypes[3] !== 'dinner' ||
      !genJson.data?.plan?.groceryList?.length
    ) {
      throw new Error('1-Day vegetarian meal plan generation failed');
    }
    mealPlanId = genJson.data.plan._id;

    // Verify no meat or poultry in vegetarian plan
    const allIngredients = genJson.data.plan.days[0].meals.flatMap((m) => m.ingredients.map((i) => i.item.toLowerCase()));
    const hasMeat = allIngredients.some((i) => i.includes('chicken') || i.includes('beef') || i.includes('pork') || i.includes('steak'));
    console.log('Vegetarian Plan Contains Meat:', hasMeat, '(Expected: false)');
    if (hasMeat) {
      throw new Error('Vegetarian meal plan contains prohibited meat products');
    }

    // 4. Instant 1-Click Swap Dish (Swap Lunch on Vegetarian Plan)
    console.log('\n[Test 3] Instant 1-Click Swap Lunch Dish (Vegetarian)');
    const initialLunch = genJson.data.plan.days[0].meals.find((m) => m.mealType === 'lunch');
    console.log('Initial Lunch:', initialLunch?.name);

    const swapRes = await fetch(`${baseUrl}/nutrition/meal-plans/swap-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        mealType: 'lunch',
      }),
    });
    const swapJson = await swapRes.json();
    console.log(`Status: ${swapRes.status} (Expected: 200)`);
    const newLunch = swapJson.data?.plan?.days?.[0]?.meals?.find((m) => m.mealType === 'lunch');
    console.log('Swapped Lunch Dish:', newLunch?.name, `(${newLunch?.calories} kcal, ${newLunch?.protein}g protein)`);

    if (swapRes.status !== 200 || !newLunch || !newLunch.ingredients?.length) {
      throw new Error('Swap meal dish failed');
    }

    // 5. Verify Chronological Meal Order Preserved in Active Plan
    console.log('\n[Test 4] Verify Chronological Meal Order Preserved in Active Plan');
    const activeRes = await fetch(`${baseUrl}/nutrition/meal-plans/active`, {
      headers: { Cookie: user1Cookie },
    });
    const activeJson = await activeRes.json();
    const activeOrder = activeJson.data?.plan?.days?.[0]?.meals?.map((m) => m.mealType);
    console.log('Active Meal Order:', activeOrder);

    if (
      activeOrder[0] !== 'breakfast' ||
      activeOrder[1] !== 'lunch' ||
      activeOrder[2] !== 'snack' ||
      activeOrder[3] !== 'dinner'
    ) {
      throw new Error('Meal order not preserved in active plan');
    }

    // 6. Security & User Isolation
    console.log('\n[Test 5] Security & Isolation: User 2 cannot access or mutate User 1 meal plans');
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Chef Imposter', email: user2Email, password: 'Password123!' }),
    });
    const reg2Json = await reg2Res.json();
    user2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0];
    user2Id = reg2Json.data.user._id;

    // User 2 cannot swap meal on empty plan
    const unauthorizedSwap = await fetch(`${baseUrl}/nutrition/meal-plans/swap-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ mealType: 'lunch' }),
    });
    console.log(`User 2 Swap on No Plan Status: ${unauthorizedSwap.status} (Expected: 404)`);
    if (unauthorizedSwap.status !== 404) {
      throw new Error('User 2 should receive 404 when no active plan exists');
    }

    // Cleanup test data
    await MealPlan.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await FoodLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    console.log('\nTest data cleaned up successfully.');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 6 NUTRITION & MEAL PLAN TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Phase 6 Test Failed:', err);
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

runPhase6Tests();
