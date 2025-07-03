// Mock subscription middleware functionality
const planHierarchy = {
  light: 0,
  plus: 1,
  pro: 2,
  trial: 3
};

function checkPlanAccess(userPlan, requiredPlan) {
  const userLevel = planHierarchy[userPlan] || -1;
  const requiredLevel = planHierarchy[requiredPlan] || 0;
  return userLevel >= requiredLevel;
}

// Simple test runner
function runTests() {
  console.log('Testing Subscription Middleware Plan Hierarchy...\n');
  
  // Test 1: Light plan should NOT access pro routes
  const test1 = checkPlanAccess('light', 'pro') === false;
  console.log(`✓ Light plan denied pro access: ${test1 ? 'PASS' : 'FAIL'}`);
  
  // Test 2: Trial should access all routes
  const test2a = checkPlanAccess('trial', 'light') === true;
  const test2b = checkPlanAccess('trial', 'plus') === true;
  const test2c = checkPlanAccess('trial', 'pro') === true;
  const test2 = test2a && test2b && test2c;
  console.log(`✓ Trial plan accesses all routes: ${test2 ? 'PASS' : 'FAIL'} (${test2a},${test2b},${test2c})`);
  
  // Test 3: Pro should access light
  const test3 = checkPlanAccess('pro', 'light') === true;
  console.log(`✓ Pro plan accesses light: ${test3 ? 'PASS' : 'FAIL'} (pro:2 >= light:0)`);
  
  // Test 4: Unknown plan should be denied
  const test4 = checkPlanAccess('unknown', 'light') === false;
  console.log(`✓ Unknown plan denied: ${test4 ? 'PASS' : 'FAIL'}`);
  
  const allPassed = test1 && test2 && test3 && test4;
  console.log(`\nAll tests: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return allPassed;
}

// Run tests
runTests();