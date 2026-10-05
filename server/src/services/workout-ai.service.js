const geminiService = require('./gemini.service');
const exercisesCatalog = require('../data/exercises');
const { workoutPlanZodSchema } = require('../validators/workout.validator');
const logger = require('../utils/logger');

/**
 * Build System & User Prompt for Gemini
 */
const buildWorkoutPrompt = (user, options = {}) => {
  const profile = user.profile || {};
  const goal = profile.primaryGoal || 'muscle_gain';
  const level = profile.fitnessLevel || 'intermediate';
  const daysPerWeek = profile.workoutDaysPerWeek || 4;
  const duration = options.durationOverride || profile.preferredWorkoutDuration || 45;
  const equipment = profile.equipment?.length ? profile.equipment : ['dumbbells', 'bench'];
  const preferredExercises = profile.preferences?.preferredExercises || [];
  const dislikedExercises = profile.preferences?.dislikedExercises || [];
  const splitPref = options.splitPreference || profile.preferences?.preferredWorkoutStyle || 'Optimal Split';

  const systemInstruction = `You are FitPilot AI, a world-class certified strength & conditioning coach and exercise physiologist.
Your task is to design a personalized 7-Day Weekly Workout Routine (Day 1 through Day 7).

STRICT RULES:
1. ONLY prescribe exercises that can be performed with the user's available equipment: [${equipment.join(', ')}]. If they only have bodyweight, ONLY use bodyweight exercises.
2. NEVER include disliked exercises: [${dislikedExercises.join(', ')}].
3. Prioritize preferred exercises: [${preferredExercises.join(', ')}] where appropriate.
4. The schedule array MUST contain EXACTLY 7 items (Day 1 to Day 7).
   - Training days (${daysPerWeek} days) have isRestDay: false, exercises populated.
   - Rest/Recovery days (${7 - daysPerWeek} days) have isRestDay: true, targetMuscles: ["Active Recovery / Mobility"], exercises: [].
5. Output MUST be valid JSON adhering exactly to the required JSON schema without any markdown formatting.`;

  const prompt = `Generate a complete 7-day weekly workout plan for this athlete:
- Athlete: ${user.name}
- Goal: ${goal}
- Experience Level: ${level}
- Training Days: ${daysPerWeek} days per week (and ${7 - daysPerWeek} rest days)
- Target Duration: ${duration} minutes per session
- Available Equipment: ${equipment.join(', ')}
- Preferred Workout Split: ${splitPref}
- Custom Focus / Notes: ${options.customNotes || 'Balanced progressive overload'}

Return a JSON object with this exact structure:
{
  "title": "Clear split title (e.g. 4-Day Upper/Lower Hypertrophy Plan)",
  "goal": "${goal}",
  "fitnessLevel": "${level}",
  "daysPerWeek": ${daysPerWeek},
  "targetDurationMinutes": ${duration},
  "currentDayNumber": 1,
  "summary": "2-3 sentences explaining the split rationale and progressive overload strategy.",
  "schedule": [
    {
      "dayNumber": 1,
      "dayName": "Day 1 - Upper Body Push & Pull",
      "isRestDay": false,
      "targetMuscles": ["Chest", "Back", "Shoulders"],
      "estimatedDuration": ${duration},
      "status": "pending",
      "exercises": [
        {
          "name": "Exercise Name",
          "targetMuscle": "Primary Muscle",
          "equipment": "Equipment used",
          "sets": 3,
          "reps": "8-12 reps",
          "restSeconds": 60,
          "rpeTarget": 8,
          "weightRecommendation": "Moderate-Heavy (RPE 8)",
          "instructions": ["Step 1", "Step 2"],
          "tips": "Important form cue"
        }
      ]
    },
    {
      "dayNumber": 2,
      "dayName": "Day 2 - Lower Body Strength",
      "isRestDay": false,
      "targetMuscles": ["Quadriceps", "Hamstrings", "Glutes"],
      "estimatedDuration": ${duration},
      "status": "pending",
      "exercises": []
    },
    {
      "dayNumber": 3,
      "dayName": "Day 3 - Active Recovery & Mobility",
      "isRestDay": true,
      "targetMuscles": ["Active Recovery / Rest"],
      "estimatedDuration": 20,
      "status": "pending",
      "exercises": []
    },
    {
      "dayNumber": 4,
      "dayName": "Day 4 - Upper Body Hypertrophy",
      "isRestDay": false,
      "targetMuscles": ["Shoulders", "Arms", "Chest"],
      "estimatedDuration": ${duration},
      "status": "pending",
      "exercises": []
    },
    {
      "dayNumber": 5,
      "dayName": "Day 5 - Posterior Chain & Core",
      "isRestDay": false,
      "targetMuscles": ["Hamstrings", "Glutes", "Abs"],
      "estimatedDuration": ${duration},
      "status": "pending",
      "exercises": []
    },
    {
      "dayNumber": 6,
      "dayName": "Day 6 - Active Recovery & Mobility",
      "isRestDay": true,
      "targetMuscles": ["Active Recovery / Rest"],
      "estimatedDuration": 20,
      "status": "pending",
      "exercises": []
    },
    {
      "dayNumber": 7,
      "dayName": "Day 7 - Full Rest & Recovery",
      "isRestDay": true,
      "targetMuscles": ["Full Rest"],
      "estimatedDuration": 0,
      "status": "pending",
      "exercises": []
    }
  ]
}`;

  return { systemInstruction, prompt };
};

/**
 * Algorithmic Expert Fallback Generator
 * Always generates a complete 7-day schedule (Day 1 to Day 7)
 */
const generateAlgorithmicPlan = (user, options = {}) => {
  const profile = user.profile || {};
  const goal = profile.primaryGoal || 'muscle_gain';
  const level = profile.fitnessLevel || 'intermediate';
  const daysPerWeek = profile.workoutDaysPerWeek || 4;
  const duration = options.durationOverride || profile.preferredWorkoutDuration || 45;
  const userEquipment = profile.equipment?.length ? profile.equipment : ['dumbbells', 'bench'];
  const disliked = (profile.preferences?.dislikedExercises || []).map((e) => e.toLowerCase());

  // Filter catalog based on equipment and disliked list
  const availableExercises = exercisesCatalog.filter((ex) => {
    if (disliked.some((d) => ex.name.toLowerCase().includes(d))) return false;
    if (userEquipment.includes('full_gym')) return true;
    if (ex.equipment.includes('no_equipment')) return true;
    return ex.equipment.some((eq) => userEquipment.includes(eq));
  });

  const getExercisesForGroup = (groups, count = 4) => {
    const matched = availableExercises.filter((ex) => groups.includes(ex.targetMuscleGroup));
    const pool = matched.length >= count ? matched : exercisesCatalog.filter((ex) => groups.includes(ex.targetMuscleGroup));
    return pool.slice(0, count).map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      targetMuscle: ex.targetMuscle,
      equipment: ex.equipment.join(', '),
      sets: goal === 'strength' ? 4 : 3,
      reps: goal === 'strength' ? '5-6 reps' : goal === 'endurance' ? '15-20 reps' : '8-12 reps',
      restSeconds: goal === 'strength' ? 90 : 60,
      rpeTarget: level === 'advanced' ? 9 : 8,
      weightRecommendation: goal === 'strength' ? 'Heavy (RPE 8.5)' : 'Moderate (RPE 8)',
      instructions: ex.instructions,
      tips: ex.tips,
    }));
  };

  const schedule = [];

  if (daysPerWeek === 3) {
    // 3 Days Training + 4 Rest Days
    schedule.push(
      {
        dayNumber: 1,
        dayName: 'Day 1 - Full Body Power & Push',
        isRestDay: false,
        targetMuscles: ['Chest', 'Quadriceps', 'Shoulders', 'Triceps'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'legs', 'shoulders'], 5),
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Active Recovery & Mobility',
        isRestDay: true,
        targetMuscles: ['Active Recovery / Rest'],
        estimatedDuration: 20,
        status: 'pending',
        exercises: [],
      },
      {
        dayNumber: 3,
        dayName: 'Day 3 - Full Body Pull & Posterior Chain',
        isRestDay: false,
        targetMuscles: ['Back', 'Hamstrings', 'Biceps', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['back', 'legs', 'arms', 'core'], 5),
      },
      {
        dayNumber: 4,
        dayName: 'Day 4 - Active Recovery & Mobility',
        isRestDay: true,
        targetMuscles: ['Active Recovery / Rest'],
        estimatedDuration: 20,
        status: 'pending',
        exercises: [],
      },
      {
        dayNumber: 5,
        dayName: 'Day 5 - Full Body Hypertrophy & Conditioning',
        isRestDay: false,
        targetMuscles: ['Full Body', 'Shoulders', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'back', 'legs', 'core'], 5),
      },
      {
        dayNumber: 6,
        dayName: 'Day 6 - Active Recovery & Light Walk',
        isRestDay: true,
        targetMuscles: ['Active Recovery / Rest'],
        estimatedDuration: 15,
        status: 'pending',
        exercises: [],
      },
      {
        dayNumber: 7,
        dayName: 'Day 7 - Full Rest & Recovery',
        isRestDay: true,
        targetMuscles: ['Full Rest'],
        estimatedDuration: 0,
        status: 'pending',
        exercises: [],
      }
    );
  } else if (daysPerWeek === 5) {
    // 5 Days Training + 2 Rest Days
    schedule.push(
      {
        dayNumber: 1,
        dayName: 'Day 1 - Chest & Triceps (Push Power)',
        isRestDay: false,
        targetMuscles: ['Chest', 'Triceps'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'arms'], 5),
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Back & Biceps (Pull Power)',
        isRestDay: false,
        targetMuscles: ['Back', 'Biceps'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['back', 'arms'], 5),
      },
      {
        dayNumber: 3,
        dayName: 'Day 3 - Legs & Abs (Lower Body Dominance)',
        isRestDay: false,
        targetMuscles: ['Quadriceps', 'Hamstrings', 'Calves', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['legs', 'core'], 5),
      },
      {
        dayNumber: 4,
        dayName: 'Day 4 - Shoulders & Upper Traps (Deltoid Focus)',
        isRestDay: false,
        targetMuscles: ['Shoulders', 'Upper Back'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['shoulders', 'core'], 4),
      },
      {
        dayNumber: 5,
        dayName: 'Day 5 - Full Body Hypertrophy & Arm Pump',
        isRestDay: false,
        targetMuscles: ['Full Body', 'Arms'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'back', 'legs'], 5),
      },
      {
        dayNumber: 6,
        dayName: 'Day 6 - Active Recovery & Mobility',
        isRestDay: true,
        targetMuscles: ['Active Recovery / Rest'],
        estimatedDuration: 20,
        status: 'pending',
        exercises: [],
      },
      {
        dayNumber: 7,
        dayName: 'Day 7 - Full Rest & Recovery',
        isRestDay: true,
        targetMuscles: ['Full Rest'],
        estimatedDuration: 0,
        status: 'pending',
        exercises: [],
      }
    );
  } else if (daysPerWeek === 6) {
    // 6 Days Training (Push/Pull/Legs x 2) + 1 Rest Day
    schedule.push(
      {
        dayNumber: 1,
        dayName: 'Day 1 - Push A (Chest, Shoulders, Triceps)',
        isRestDay: false,
        targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'shoulders', 'arms'], 5),
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Pull A (Back, Rear Delts, Biceps)',
        isRestDay: false,
        targetMuscles: ['Back', 'Biceps'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['back', 'arms'], 5),
      },
      {
        dayNumber: 3,
        dayName: 'Day 3 - Legs A (Quads, Hamstrings, Calves)',
        isRestDay: false,
        targetMuscles: ['Quadriceps', 'Hamstrings', 'Calves'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['legs'], 5),
      },
      {
        dayNumber: 4,
        dayName: 'Day 4 - Push B (Shoulder & Upper Chest Focus)',
        isRestDay: false,
        targetMuscles: ['Shoulders', 'Chest', 'Triceps'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['shoulders', 'chest'], 5),
      },
      {
        dayNumber: 5,
        dayName: 'Day 5 - Pull B (Lats & Biceps Peak Focus)',
        isRestDay: false,
        targetMuscles: ['Back', 'Biceps', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['back', 'arms', 'core'], 5),
      },
      {
        dayNumber: 6,
        dayName: 'Day 6 - Legs B (Posterior Chain & Core)',
        isRestDay: false,
        targetMuscles: ['Hamstrings', 'Glutes', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['legs', 'core'], 5),
      },
      {
        dayNumber: 7,
        dayName: 'Day 7 - Full Rest & Recovery',
        isRestDay: true,
        targetMuscles: ['Full Rest'],
        estimatedDuration: 0,
        status: 'pending',
        exercises: [],
      }
    );
  } else {
    // Default: 4-Day Upper / Lower Split + 3 Rest Days (Standard 7-Day Plan)
    schedule.push(
      {
        dayNumber: 1,
        dayName: 'Day 1 - Upper Body Push & Pull (Strength Focus)',
        isRestDay: false,
        targetMuscles: ['Chest', 'Back', 'Shoulders'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'back', 'shoulders'], 5),
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Lower Body & Core (Quad & Glute Dominance)',
        isRestDay: false,
        targetMuscles: ['Quadriceps', 'Glutes', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['legs', 'core'], 5),
      },
      {
        dayNumber: 3,
        dayName: 'Day 3 - Active Recovery & Mobility',
        isRestDay: true,
        targetMuscles: ['Active Recovery / Rest'],
        estimatedDuration: 20,
        status: 'pending',
        exercises: [],
      },
      {
        dayNumber: 4,
        dayName: 'Day 4 - Upper Body Hypertrophy & Arms',
        isRestDay: false,
        targetMuscles: ['Chest', 'Back', 'Arms'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['chest', 'back', 'arms'], 5),
      },
      {
        dayNumber: 5,
        dayName: 'Day 5 - Posterior Chain & Core (Hamstring & Calves)',
        isRestDay: false,
        targetMuscles: ['Hamstrings', 'Glutes', 'Core'],
        estimatedDuration: duration,
        status: 'pending',
        exercises: getExercisesForGroup(['legs', 'core'], 5),
      },
      {
        dayNumber: 6,
        dayName: 'Day 6 - Active Recovery & Light Cardio',
        isRestDay: true,
        targetMuscles: ['Active Recovery / Rest'],
        estimatedDuration: 20,
        status: 'pending',
        exercises: [],
      },
      {
        dayNumber: 7,
        dayName: 'Day 7 - Full Rest & Recovery',
        isRestDay: true,
        targetMuscles: ['Full Rest'],
        estimatedDuration: 0,
        status: 'pending',
        exercises: [],
      }
    );
  }

  return {
    title: `${daysPerWeek}-Day ${goal.replace('_', ' ').toUpperCase()} Progression Blueprint`,
    goal,
    fitnessLevel: level,
    daysPerWeek,
    targetDurationMinutes: duration,
    currentDayNumber: 1,
    summary: `Engineered specifically for your ${level} level and ${userEquipment.join(', ')} equipment. Features a structured 7-day progression balancing ${daysPerWeek} high-intensity sessions with ${7 - daysPerWeek} scheduled recovery days.`,
    schedule,
  };
};

/**
 * Generate AI Workout Plan via Gemini or Fallback
 */
const generateWorkoutPlanAI = async (user, options = {}) => {
  const { systemInstruction, prompt } = buildWorkoutPrompt(user, options);

  let rawPlan = await geminiService.generateStructuredJson(systemInstruction, prompt);

  if (rawPlan) {
    const validated = workoutPlanZodSchema.safeParse(rawPlan);
    if (validated.success) {
      logger.info(`Gemini AI successfully generated 7-day workout plan: "${validated.data.title}"`);
      return {
        ...validated.data,
        currentDayNumber: 1,
        aiMetadata: {
          model: 'gemini-1.5-flash',
          generatedAt: new Date(),
          customInstructions: options.customNotes || '',
        },
      };
    } else {
      logger.warn('Gemini response failed Zod validation. Using algorithmic plan generator.', validated.error);
    }
  }

  logger.info('Generating algorithmic expert 7-day workout plan fallback.');
  const fallbackPlan = generateAlgorithmicPlan(user, options);
  const validatedFallback = workoutPlanZodSchema.parse(fallbackPlan);
  return {
    ...validatedFallback,
    currentDayNumber: 1,
    aiMetadata: {
      model: 'fitpilot-expert-rules',
      generatedAt: new Date(),
      customInstructions: options.customNotes || '',
    },
  };
};

module.exports = {
  generateWorkoutPlanAI,
};
