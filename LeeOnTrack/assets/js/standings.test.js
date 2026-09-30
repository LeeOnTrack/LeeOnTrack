/**
 * Browser-based test for standingsUtils
 * Run this in the browser console after loading standingsUtils.js
 * 
 * To use:
 * 1. Load the page that includes standingsUtils.js
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file content
 * 4. Call runStandingsTests()
 */

function runStandingsTests() {
  // Check if calculateStandingsRanks is available
  if (typeof calculateStandingsRanks === 'undefined') {
    console.error('calculateStandingsRanks function not found. Make sure standingsUtils.js is loaded.');
    return;
  }

  const sampleData = [
    { driver: 'Naven C', points: 61, wins: 2 },
    { driver: 'Fil W', points: 30, wins: 0 },
    { driver: 'Sasha B', points: 30, wins: 0 },
    { driver: 'Daniel T', points: 27, wins: 0 },
    { driver: 'Lee H', points: 19, wins: 0 },
    { driver: 'Shaun T', points: 18, wins: 0 },
    { driver: 'Scott L', points: 15, wins: 0 },
    { driver: 'Neil B', points: 12, wins: 0 },
    { driver: 'Erick I', points: 10, wins: 0 },
    { driver: 'Tony G', points: 10, wins: 0 },
    { driver: 'Scott E', points: 8, wins: 0 },
    { driver: 'Myles G', points: 7, wins: 0 },
    { driver: 'Paul B', points: 6, wins: 0 },
    { driver: 'Alex M', points: 5, wins: 0 },
    { driver: 'Charlie L', points: 0, wins: 0 },
  ];

  console.log('🏁 Running standingsUtils tests...\n');

  // Test 1: Assigns equal POS ranks to drivers tied on points
  const result = calculateStandingsRanks(sampleData);
  const fil = result.find((d) => d.driver === 'Fil W');
  const sasha = result.find((d) => d.driver === 'Sasha B');
  const erick = result.find((d) => d.driver === 'Erick I');
  const tony = result.find((d) => d.driver === 'Tony G');

  console.log('✅ Test 1: Equal POS ranks for tied drivers');
  console.log(`   Fil W pos: ${fil?.pos} (expected: 2)`);
  console.log(`   Sasha B pos: ${sasha?.pos} (expected: 2)`);
  console.log(`   Erick I pos: ${erick?.pos} (expected: 9)`);
  console.log(`   Tony G pos: ${tony?.pos} (expected: 9)`);
  const test1Pass = fil?.pos === 2 && sasha?.pos === 2 && erick?.pos === 9 && tony?.pos === 9;
  console.log(`   Result: ${test1Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: Skips rank numbers correctly after a tie
  const daniel = result.find((d) => d.driver === 'Daniel T');
  const scott = result.find((d) => d.driver === 'Scott E');

  console.log('✅ Test 2: Skip rank numbers after ties');
  console.log(`   Daniel T pos: ${daniel?.pos} (expected: 4)`);
  console.log(`   Scott E pos: ${scott?.pos} (expected: 11)`);
  const test2Pass = daniel?.pos === 4 && scott?.pos === 11;
  console.log(`   Result: ${test2Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 3: Full standings output
  console.log('✅ Test 3: Full standings output');
  console.log('   POS | DRIVER     | POINTS | WINS');
  console.log('   ----|------------|--------|-----');
  result.forEach(d => {
    console.log(`   ${String(d.pos).padStart(3)} | ${d.driver.padEnd(10)} | ${String(d.points).padStart(6)} | ${d.wins}`);
  });
  console.log('');

  // Test 4: Verify tiebreaker sorting (Fil W before Sasha B)
  const filIndex = result.findIndex(d => d.driver === 'Fil W');
  const sashaIndex = result.findIndex(d => d.driver === 'Sasha B');
  console.log('✅ Test 4: Tiebreaker sorting');
  console.log(`   Fil W index: ${filIndex} (should be before Sasha B)`);
  console.log(`   Sasha B index: ${sashaIndex}`);
  const test4Pass = filIndex < sashaIndex;
  console.log(`   Result: ${test4Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // Summary
  const allPass = test1Pass && test2Pass && test4Pass;
  console.log('='.repeat(50));
  console.log(`🏆 Overall Result: ${allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(50));

  return { result, test1Pass, test2Pass, test4Pass, allPass };
}

// Auto-run if not in a module context
if (typeof window !== 'undefined') {
  console.log('📋 To run tests, call: runStandingsTests()');
}
