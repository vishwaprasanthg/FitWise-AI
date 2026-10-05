const geminiService = require('./gemini.service');
const logger = require('../utils/logger');

/**
 * Format system instruction with rich athlete context
 */
const buildSystemInstruction = (context) => {
  const { user, activePlan, recentLogs, latestCheckIn, activeMealPlan, targets } = context;
  const profile = user.profile || {};
  const goal = profile.primaryGoal?.replace('_', ' ') || 'muscle gain';
  const equipment = profile.equipment?.join(', ') || 'bodyweight only';
  const diet = profile.nutritionPreferences?.dietaryPreference || 'omnivore';

  // Active workout schedule summary
  let scheduleDetails = 'No active workout routine generated yet.';
  let todayWorkoutDetails = 'None';
  if (activePlan && activePlan.schedule) {
    const currentNum = activePlan.currentDayNumber || 1;
    const currentDay = activePlan.schedule.find((d) => d.dayNumber === currentNum) || activePlan.schedule[0];
    todayWorkoutDetails = currentDay ? `Day ${currentDay.dayNumber}: "${currentDay.dayName}" (${currentDay.isRestDay ? 'Scheduled Rest' : `${currentDay.estimatedDuration} mins, Target: ${currentDay.targetMuscles?.join(', ')}, Exercises: ${currentDay.exercises?.map((e) => `${e.name} (${e.sets}x${e.reps})`).join(', ')}`})` : 'Rest';

    scheduleDetails = activePlan.schedule
      .map((d) => `Day ${d.dayNumber} [${d.status.toUpperCase()}]: ${d.dayName} (${d.isRestDay ? 'Rest' : `${d.targetMuscles?.join(', ')}`})`)
      .join(' | ');
  }

  // Active meal blueprint summary
  let mealDetails = 'Standard TDEE target';
  if (activeMealPlan && activeMealPlan.days && activeMealPlan.days[0]?.meals) {
    mealDetails = activeMealPlan.days[0].meals
      .map((m) => `${m.mealType.toUpperCase()}: ${m.name} (${m.calories} kcal, ${m.protein}g P)`)
      .join(' | ');
  }

  // Recent training volume
  const recentVolumeKg = recentLogs?.reduce((sum, l) => sum + (l.totalVolumeKg || 0), 0) || 0;
  const recentWorkoutsCount = recentLogs?.length || 0;

  return `You are "Coach Pulse", an elite AI strength & conditioning coach, exercise physiologist, and sports nutritionist for FitPilot AI.
You are coaching athlete: ${user.name}.

ATHLETE TELEMETRY & LIVE PROGRAM CONTEXT:
- Physical Stats: ${profile.weight || 75}kg, ${profile.height || 175}cm, ${profile.age || 25} yrs old, ${profile.gender || 'athlete'}
- Primary Goal: ${goal.toUpperCase()} (${profile.fitnessLevel || 'intermediate'} level)
- Available Equipment: ${equipment} (NEVER recommend exercises requiring gear they do not have)
- Active Training Program: "${activePlan ? activePlan.title : 'None'}"
- Current Active Workout Day: ${todayWorkoutDetails}
- Full 7-Day Progression: ${scheduleDetails}
- Recent Workouts (Past 7 Days): ${recentWorkoutsCount} sessions completed (${recentVolumeKg.toLocaleString()} kg total volume moved)
- Recovery Readiness: ${latestCheckIn ? `${latestCheckIn.recoveryScore}% Score (${latestCheckIn.aiCoachFeedback?.recoveryGrade || 'Optimal'}) &bull; Action: ${latestCheckIn.aiCoachFeedback?.recommendedAction || 'Progressive Overload'}` : '85% (Optimal baseline)'}
- Dietary Lifestyle: ${diet.toUpperCase()} (Allergens/Dislikes: ${profile.nutritionPreferences?.dislikedFoods?.join(', ') || 'None'})
- Caloric & Macro Targets: ${targets ? `${targets.targetDailyCalories} kcal | Protein: ${targets.targetMacros?.proteinGrams}g | Carbs: ${targets.targetMacros?.carbsGrams}g | Fats: ${targets.targetMacros?.fatsGrams}g` : '2400 kcal'}
- Active Meal Blueprint: ${mealDetails}

COACHING EXCELLENCE DIRECTIVES:
1. Always give scientifically accurate, high-impact, actionable, and encouraging coaching advice.
2. Directly reference the athlete's active program, current workout day, targets, and equipment.
3. For exercise substitutions: ALWAYS check their available equipment (${equipment}) and provide exact biomechanical equivalents with rep ranges and form cues.
4. For workout schedule questions: Clearly state what Day they are on in their 7-day progression and what exercises are scheduled.
5. For nutrition: Quote their daily calorie (${targets?.targetDailyCalories || 2500} kcal) and protein (${targets?.targetMacros?.proteinGrams || 160}g) targets.
6. Format responses with clean GitHub markdown, bold headers, concise bullet points, and high readability.`;
};

/**
 * Intelligent Algorithmic Fallback Coach Engine
 * Provides high-accuracy sports physiology, biomechanics, and nutrition responses
 */
const generateAlgorithmicCoachFallback = (userMessage, context) => {
  const query = userMessage.toLowerCase().trim();
  const { user, activePlan, recentLogs, latestCheckIn, targets, activeMealPlan } = context;
  const profile = user.profile || {};
  const goal = profile.primaryGoal?.replace('_', ' ') || 'strength and muscle gain';
  const equipment = profile.equipment || ['dumbbells', 'bench'];
  const recovery = latestCheckIn ? latestCheckIn.recoveryScore : 88;
  const calories = targets ? targets.targetDailyCalories : 2600;
  const protein = targets ? targets.targetMacros?.proteinGrams : 160;
  const carbs = targets ? targets.targetMacros?.carbsGrams : 300;
  const fats = targets ? targets.targetMacros?.fatsGrams : 70;
  const diet = profile.nutritionPreferences?.dietaryPreference || 'omnivore';

  const currentDayNum = activePlan?.currentDayNumber || 1;
  const currentDay = activePlan?.schedule?.find((d) => d.dayNumber === currentDayNum) || activePlan?.schedule?.[0];

  // 1. "What is my workout today?" / Schedule / Routine Intent
  if (
    query.includes('today') ||
    query.includes('schedule') ||
    query.includes('routine') ||
    query.includes('what should i do') ||
    query.includes('current workout') ||
    query.includes('my plan')
  ) {
    if (!activePlan || !currentDay) {
      return `### 🏋️ Coach Pulse: Your Workout Routine\n\nYou don't have an active workout plan generated yet. Head over to the **Workouts** tab and click **"Generate AI Workout Plan"** to build a personalized 7-day routine based on your available equipment (**${equipment.join(', ')}**)!`;
    }

    if (currentDay.isRestDay) {
      return `### 🛌 Coach Pulse: Today is Day ${currentDay.dayNumber} — Scheduled Rest & Recovery\n\n- **Status**: ${currentDay.dayName}\n- **Focus**: Muscle fiber repair, central nervous system rejuvenation, and joint recovery.\n- **Recommended Activity**: 20-30 min light walking, dynamic mobility stretching, and hitting your **${protein}g Protein** target.\n\n*Coach Tip*: Rest days are when muscle tissue actually grows and adapts! When you're ready, you can mark Day ${currentDay.dayNumber} as completed or skip to Day ${Math.min(currentDay.dayNumber + 1, 7)}.`;
    }

    const exList = currentDay.exercises?.map((e, idx) => `${idx + 1}. **${e.name}** — ${e.sets} sets &bull; ${e.reps} &bull; RPE ${e.rpeTarget} (${e.targetMuscle})`).join('\n') || 'Compound movements';

    return `### 🏋️ Coach Pulse: Today is Day ${currentDay.dayNumber} of 7 — ${currentDay.dayName}\n\nHere is your prescribed session for today (**~${currentDay.estimatedDuration} mins**, Target: **${currentDay.targetMuscles?.join(', ')}**):\n\n${exList}\n\n**Warmup Protocol (5 mins)**:\n- 2 mins light dynamic arm/leg swings\n- 2 light warmup sets of your first exercise before working weight\n\nClick **"Start Workout"** on your dashboard to launch the live timer and log your sets!`;
  }

  // 2. Exercise Substitutions & Alternatives
  if (
    query.includes('substitute') ||
    query.includes('alternative') ||
    query.includes('replace') ||
    query.includes('swap') ||
    query.includes('instead of') ||
    query.includes('cant do') ||
    query.includes("can't do")
  ) {
    // Chest / Bench
    if (query.includes('bench') || query.includes('chest') || query.includes('push up') || query.includes('pushup') || query.includes('fly')) {
      return `### 🏋️ Coach Pulse: Chest Exercise Substitutions\n\nCalibrated for your gear (**${equipment.join(', ')}**) and **${goal}** goal:\n\n1. **Dumbbell Floor Press / Flat DB Press**: Protects the shoulder joint at the bottom while delivering intense pectoral tension.\n2. **Deficit Push-Ups**: Elevate hands on books/plates for increased range of motion and maximal stretch.\n3. **Incline Dumbbell Press**: Emphasizes the upper clavicular head for upper chest thickness.\n4. **Standing Resistance Band / Dumbbell Flyes**: Constant tension on the inner and outer chest fibers.\n\n*Form Cue*: Retract and depress your scapulae (pull shoulder blades down and back) before pressing!`;
    }

    // Back / Pull-ups / Rows
    if (query.includes('pull up') || query.includes('pullup') || query.includes('lat') || query.includes('back') || query.includes('row')) {
      return `### 🏋️ Coach Pulse: Back & Lat Substitutions\n\nFor back development with **${equipment.join(', ')}**:\n\n1. **Single-Arm Dumbbell Row**: Allows full lat stretch and peak contraction with supported lower back.\n2. **Chest-Supported Incline DB Row**: Eliminates momentum to isolate the rhomboids and mid-traps.\n3. **Resistance Band / DB Pullovers**: Excellent lat isolation through a deep overhead arc.\n4. **Inverted Bodyweight Rows**: Performed under a sturdy table or bar to build foundational pulling strength.\n\n*Form Cue*: Initiate the pull by driving your elbows down toward your hips, not by pulling with your wrists!`;
    }

    // Legs / Squats / Quads / Hamstrings
    if (query.includes('squat') || query.includes('leg') || query.includes('quad') || query.includes('hamstring') || query.includes('deadlift') || query.includes('lunge') || query.includes('rdl')) {
      return `### 🦵 Coach Pulse: Lower Body Substitutions\n\nTargeting quads, glutes, and hamstrings with **${equipment.join(', ')}**:\n\n1. **Bulgarian Split Squats**: The gold standard unilateral movement for quad and glute hypertrophy with zero spinal load.\n2. **Goblet Squats**: Holding weight at chest height promotes an upright torso and deep quad activation.\n3. **Dumbbell Romanian Deadlifts (RDLs)**: Superior hamstring and glute builder focusing on the hip-hinge.\n4. **Walking Dumbbell Lunges**: Functional unilateral strength and core stabilization.\n\n*Coach Cue*: On RDLs, push your hips back toward the wall behind you until you feel a deep hamstring stretch, keeping the spine completely neutral!`;
    }

    // Shoulders / Overhead Press
    if (query.includes('shoulder') || query.includes('overhead') || query.includes('ohp') || query.includes('delt') || query.includes('lateral')) {
      return `### 🛡️ Coach Pulse: Shoulder & Delt Substitutions\n\nBuilding 3D deltoids with **${equipment.join(', ')}**:\n\n1. **Seated Dumbbell Overhead Press**: Strict overhead power without lower body cheat momentum.\n2. **Dumbbell Lateral Raises (Lean-Away)**: Isolate the lateral deltoid head for wider shoulders.\n3. **Chest-Supported Rear Delt Flyes**: Crucial for shoulder balance, posture, and rotator cuff integrity.\n4. **Arnold Press**: Rotational movement hitting anterior and lateral deltoids through an extended range.\n\n*Form Cue*: On lateral raises, lead with your elbows and keep wrists slightly lower than elbows to keep tension off the traps!`;
    }

    // Arms: Biceps & Triceps
    if (query.includes('bicep') || query.includes('tricep') || query.includes('arm') || query.includes('curl') || query.includes('dip')) {
      return `### 💪 Coach Pulse: Arm Substitutions (Biceps & Triceps)\n\nFor arm hypertrophy with **${equipment.join(', ')}**:\n\n- **Biceps**:\n  1. **Incline Dumbbell Curl**: Places the long head on a deep stretch for peak growth.\n  2. **Hammer Curls**: Builds the brachialis and forearms for arm thickness.\n- **Triceps**:\n  1. **Overhead Dumbbell Triceps Extension**: Maximizes long-head stretch.\n  2. **Bench Dips / Close-Grip Push-ups**: High-tension compound triceps finisher.\n\n*Coach Tip*: Keep upper arms locked in place—avoid swinging elbows forward during curls!`;
    }

    return `### 🔄 Coach Pulse: Exercise Variation\n\nWith your gear (**${equipment.join(', ')}**), we can swap any movement for an equivalent compound or isolation exercise. Which specific exercise or muscle group would you like an alternative for?`;
  }

  // 3. Nutrition, Fueling, Macros, and Diet
  if (
    query.includes('eat') ||
    query.includes('food') ||
    query.includes('nutrition') ||
    query.includes('calorie') ||
    query.includes('macro') ||
    query.includes('protein') ||
    query.includes('carb') ||
    query.includes('fat') ||
    query.includes('pre-workout') ||
    query.includes('post-workout') ||
    query.includes('diet') ||
    query.includes('snack') ||
    query.includes('bulk') ||
    query.includes('cut')
  ) {
    return `### 🥗 Coach Pulse: Nutrition & Fueling Blueprint\n\nCalibrated for your **${goal}** goal and **${diet.toUpperCase()}** lifestyle:\n\n- **Daily Energy Target**: **${calories} kcal**\n- **Target Protein**: **${protein}g** (crucial for muscle protein synthesis)\n- **Target Carbohydrates**: **${carbs}g** (muscle glycogen & training energy)\n- **Target Healthy Fats**: **${fats}g** (hormone support & cellular health)\n\n**Optimal Meal Timing**:\n1. **Pre-Workout (60-90 min prior)**: 30g protein + 40-60g easily digestible carbs (e.g. Oats with Greek yogurt / fruit).\n2. **Post-Workout (within 2h)**: 35-45g high-leucine protein + carbs to restore glycogen (e.g. Protein shake with banana, or Tofu/Chicken rice bowl).\n3. **Hydration**: 3 to 4 Liters of water daily + electrolytes on training days.\n\nCheck your **Daily Nutrition Blueprint** tab for your full 4-meal daily schedule!`;
  }

  // 4. Recovery, Fatigue, DOMS, Soreness & Deload
  if (
    query.includes('sore') ||
    query.includes('tired') ||
    query.includes('pain') ||
    query.includes('fatigue') ||
    query.includes('hurt') ||
    query.includes('recovery') ||
    query.includes('deload') ||
    query.includes('sleep') ||
    query.includes('rest')
  ) {
    return `### 🔋 Coach Pulse: Recovery & Fatigue Management\n\nYour current readiness is calibrated at **${recovery}% Recovery**.\n\n**Protocols for Optimal Recovery**:\n1. **DOMS (Muscle Soreness)**: Natural response to micro-tears from progressive overload. Light 15-min walking and proper hydration accelerate waste clearance.\n2. **Sleep Hygiene**: 7.5 to 9 hours of quality sleep is responsible for ~95% of human growth hormone (HGH) release.\n3. **Joint vs Muscle Pain**: If you experience sharp joint/tendon pain, **stop that movement immediately**. Never train through sharp joint pain.\n4. **When to Deload**: If systemic fatigue stays high for 2+ consecutive sessions, take a light deload week (50% volume) to let ligaments and the nervous system catch up.\n\nLog your weekly **Check-in** on the dashboard so I can dynamically adapt your volume!`;
  }

  // 5. Technique, Biomechanics & Form Cues
  if (
    query.includes('form') ||
    query.includes('technique') ||
    query.includes('how to') ||
    query.includes('cue') ||
    query.includes('lift') ||
    query.includes('posture')
  ) {
    return `### 🎯 Coach Pulse: Lifting Biomechanics & Form Masterclass\n\n3 Golden Rules for Maximum Muscle Recruitment and Injury Prevention:\n\n1. **360° Core Bracing (Valsalva)**: Take a deep belly breath and brace your abdominal wall as if preparing for a punch. Lock this before every heavy rep.\n2. **Controlled Eccentric (Negative)**: Lower the weight for 2 to 3 seconds under active muscular tension. Eccentric loading drives the highest hypertrophic signaling.\n3. **Joint Alignment**: Keep wrists straight on presses, elbows tucked ~45° (not flared 90°), and knees tracking over your 2nd and 3rd toes on all squats.\n\nWhich exercise form would you like me to break down step-by-step?`;
  }

  // 6. Progressive Overload & Breaking Stalls / Plateaus
  if (
    query.includes('stuck') ||
    query.includes('plateau') ||
    query.includes('progress') ||
    query.includes('overload') ||
    query.includes('heavy') ||
    query.includes('stronger') ||
    query.includes('pr') ||
    query.includes('1rm')
  ) {
    return `### 📈 Coach Pulse: Progressive Overload & Plateau Busting\n\nTo continuously trigger hypertrophy and strength adaptations without stalling:\n\n1. **Double Progression Method**: Work within a rep range (e.g., 8-12 reps). Keep weight constant until you hit all sets at 12 reps with good form, then increase weight by 2.5kg and repeat from 8 reps.\n2. **RPE Management**: Keep most working sets between **RPE 7.5 - 8.5** (leaving 1-2 reps in reserve). Training to absolute failure on every set causes disproportionate central fatigue.\n3. **Micro-Loading**: Small 1-2kg jumps are much more sustainable long-term than large 5kg jumps.\n4. **Nutritional Surplus**: Make sure you are consistently hitting your **${calories} kcal** daily target so muscle protein synthesis has sufficient energetic fuel.\n\nKeep logging your workout sets accurately in the live tracker so I can track your PRs and volume curve!`;
  }

  // 7. General Coach Greeting & Dynamic Menu
  return `### ⚡ Coach Pulse at your service, ${user.name}!\n\nI'm dialed into your **${goal}** program (**${activePlan ? activePlan.title : 'Active Split'}**) and available gear (**${equipment.join(', ')}**).\n\n**Here is how I can assist you right now**:\n- 🏋️ **Today's Workout**: Ask *"What is my workout today?"* to see Day ${currentDayNum}'s prescribed exercises\n- 🔄 **Exercise Substitutions**: Ask *"Give me alternatives for bench press / squats / pullups"*\n- 🥗 **Nutrition & Fueling**: Ask *"What should I eat pre-workout?"* or review your **${calories} kcal & ${protein}g Protein** targets\n- 🎯 **Lifting Mechanics**: Ask for form cues and technique breakdowns for any exercise\n- 🔋 **Fatigue Management**: Ask how to optimize recovery or when to deload\n\nWhat are we focusing on today?`;
};

/**
 * Generate AI Coach Pulse Response
 */
const generateCoachResponse = async (userMessage, chatHistory, context) => {
  const systemInstruction = buildSystemInstruction(context);

  // Format recent chat history into conversational turns
  const formattedHistory = (chatHistory || []).slice(-10).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const prompt = `${userMessage}`;

  try {
    const rawAiResponse = await geminiService.generateTextContent(
      systemInstruction,
      prompt,
      formattedHistory
    );

    if (rawAiResponse && rawAiResponse.trim()) {
      return rawAiResponse;
    }
  } catch (err) {
    logger.warn('Gemini chat request failed. Switching to algorithmic Coach Pulse fallback.', err.message);
  }

  // Fallback
  logger.info('Generating algorithmic Coach Pulse response fallback.');
  return generateAlgorithmicCoachFallback(userMessage, context);
};

module.exports = {
  buildSystemInstruction,
  generateAlgorithmicCoachFallback,
  generateCoachResponse,
};
