const { spawn } = require('child_process');
const path = require('path');

const phases = [
  { name: 'Phase 1: Auth & User Identity', script: 'test-phase1.js' },
  { name: 'Phase 2: Fitness & Nutrition Onboarding', script: 'test-phase2.js' },
  { name: 'Phase 3: AI Workout Core & Catalog', script: 'test-phase3.js' },
  { name: 'Phase 4: Active Workout & Session Logging', script: 'test-phase4.js' },
  { name: 'Phase 5: AI Coaching Loop & Overload Progression', script: 'test-phase5.js' },
  { name: 'Phase 6: Nutrition Assistant, AI Meal Plan & Food Log', script: 'test-phase6.js' },
  { name: 'Phase 7: AI Chat Coach (Coach Pulse) Context HUD', script: 'test-phase7.js' },
  { name: 'Phase 8: Analytics, PR Trophies & 1RM Math', script: 'test-phase8.js' },
];

async function runTest(phase) {
  return new Promise((resolve, reject) => {
    console.log(`\n======================================================`);
    console.log(`🚀 EXECUTING: ${phase.name}`);
    console.log(`   Script: src/${phase.script}`);
    console.log(`======================================================`);

    const child = spawn('node', [path.join(__dirname, phase.script)], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${phase.name} PASSED SUCCESSFULLY!`);
        resolve();
      } else {
        console.error(`\n❌ ${phase.name} FAILED with exit code ${code}`);
        reject(new Error(`${phase.name} failed`));
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ Error spawning ${phase.script}:`, err);
      reject(err);
    });
  });
}

async function runAllPhases() {
  console.log(`\n**************************************************************`);
  console.log(`   FITPILOT AI — MASTER END-TO-END AUTOMATED TEST RUNNER`);
  console.log(`**************************************************************\n`);

  const startTime = Date.now();
  let passedCount = 0;

  for (const phase of phases) {
    try {
      await runTest(phase);
      passedCount++;
    } catch (err) {
      console.error(`\n🚨 MASTER TEST RUN TERMINATED DUE TO FAILURE IN: ${phase.name}`);
      process.exit(1);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n==============================================================`);
  console.log(`🎉 ALL ${passedCount}/${phases.length} PHASES PASSED WITH 100% SUCCESS!`);
  console.log(`⏱️ Total Execution Time: ${durationSec}s`);
  console.log(`==============================================================\n`);
  process.exit(0);
}

runAllPhases();
