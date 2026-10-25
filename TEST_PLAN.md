# EcO Smart Ledger — Verification & Regression Test Plan

This document outlines the test strategy and automated regression test results for EcO Smart Ledger.

---

## 1. Automated Regression Suite (`src/domain/regressionTests.ts`)

The automated regression suite runs automatically in the application Settings under **System Audit & Regression Tests** and can be inspected live by the user at any time.

### Test Cases
1. **Indian / Bangladeshi Digit Grouping**:
   - Input: `162450`
   - Expected Output: `৳ 1,62,450.00`
   - Status: PASSED
2. **Mandatory Lending Regression Test**:
   - Initial: Cash ৳1,040, bKash ৳8,000, Nagad ৳0 -> Total ৳9,040
   - Lend ৳500 to Emon via bKash
   - Verified: bKash decreases to ৳7,500; Liquid Total = ৳8,540; Receivables = ৳500; Net Total = ৳9,040
   - Status: PASSED
3. **Duplicate Payment Method Suffixing**:
   - Creating `"City Bank"` when `"City Bank"` and `"City Bank~2"` exist generates `"City Bank~3"`
   - Status: PASSED
4. **Recurring End Date Math (Inclusive)**:
   - Start: `2026-10-01`, Duration: 30 days -> End: `2026-10-30` ($S + D - 1$)
   - Status: PASSED
5. **`eco-backup` v1 Selective Method Ingestion**:
   - Ingesting a backup containing Cash and bKash (but no Nagad) creates Cash and bKash only.
   - Status: PASSED

---

## 2. Interactive & Usability Test Plan

| Feature | Scenario | Expected Result |
| :--- | :--- | :--- |
| **First Launch Onboarding** | New user path | Starts with Cash only; guides to dashboard |
| **First Launch Onboarding** | 1-Click sample backup | Ingests sample v1 backup, verifies counts, shows report |
| **Global Add (+)** | Multi-step Expense | Advances through type -> details, prevents double submission |
| **Global Add (+)** | Transfer fee preview | Shows 2% fee when applicable; preserves 0% fee without override |
| **Unified List** | Filters & Search | Real-time filtering by category, date, wallet, person |
| **People Ledger** | WhatsApp Reminder | Copies polite message to clipboard and launches `https://wa.me` deep link |
| **PWA** | Offline Mode | Offline banner appears when network is disconnected |
