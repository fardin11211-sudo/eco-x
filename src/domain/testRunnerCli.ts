/**
 * Standalone CLI Test Runner for EcO Smart Ledger
 * Run with: npx tsx src/domain/testRunnerCli.ts
 */

import { runAllRegressionTests } from './regressionTests';
import { calculateTransferCharge } from './calculations';
import { validateTransferInput, validateExpenseInput } from './validation';
import { formatTaka } from './money';

console.log('\n======================================================');
console.log('   EcO Smart Ledger — Automated Regression Test Suite  ');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function report(testName: string, passed: boolean, details?: string) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m  ${testName}`);
  } else {
    console.log(`  \x1b[31m✖ FAIL\x1b[0m  ${testName}`);
    if (details) console.log(`         \x1b[33m${details}\x1b[0m`);
  }
}

// 1. Run core regression tests
const regressionResults = runAllRegressionTests();
regressionResults.forEach((t) => {
  report(t.name, t.passed, t.error || (t.passed ? '' : `Expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(t.actual)}`));
});

// 2. Extra Test: Zero-percent fee rate must NOT fall back to 2%
const zeroFee = calculateTransferCharge(1000, 0, true);
report(
  'Zero-percent fee rate preservation (0% fee stays 0, not 2%)',
  zeroFee.chargeAmount === 0 && zeroFee.totalSourceDeduction === 1000,
  `Got chargeAmount: ${zeroFee.chargeAmount}`
);

// 3. Extra Test: Lakhs & Crores formatting
const croreFormatted = formatTaka(10000000);
report(
  'Large sum grouping (1 Crore: 10000000 -> ৳ 1,00,00,000.00)',
  croreFormatted === '৳ 1,00,00,000.00',
  `Got ${croreFormatted}`
);

// 4. Extra Test: Transfer From and To must differ validation
const sameTransferVal = validateTransferInput({
  fromMethodId: 'm_cash',
  toMethodId: 'm_cash',
  amount: 500
});
report(
  'Transfer validation rejects identical From and To methods',
  !sameTransferVal.isValid && Boolean(sameTransferVal.errors.toMethodId),
  'Did not flag same From/To method'
);

// 5. Extra Test: Negative expense rejection
const negExpenseVal = validateExpenseInput({
  amount: -50,
  category: 'Food',
  payMethodId: 'm_cash',
  date: '2026-10-22'
});
report(
  'Expense validation rejects negative amount',
  !negExpenseVal.isValid && Boolean(negExpenseVal.errors.amount),
  'Accepted negative amount'
);

console.log('\n------------------------------------------------------');
console.log(`Summary: ${passedTests} of ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}% success rate).`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
