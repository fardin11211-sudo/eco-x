# EcO Smart Ledger — Data Model & Calculation Specification

This document defines the schema, calculation algorithms, and legacy `eco-backup` v1 migration contracts used throughout EcO Smart Ledger.

---

## 1. Domain Entities

### UserSettings (`settings/main`)
```typescript
interface UserSettings {
  id: string; // 'main'
  theme: 'dark'; // Dark only
  setupComplete: boolean;
  budgetMode: 'direct' | 'calculated' | 'none';
  directDailyBudget: number; // e.g. ৳ 500.00
  monthlyIncome: number;     // e.g. ৳ 45,000.00
  monthlyFixed: number;      // e.g. ৳ 12,000.00
  monthlySavings: number;    // e.g. ৳ 5,000.00
  monthlyEmergency: number;  // e.g. ৳ 3,000.00
  bufferPct: number;         // e.g. 10%
  cashoutChargeRate: number; // default 2%
  categories: string[];
  tags: string[];
  currencySymbol: string;    // '৳'
}
```

### PaymentMethod (`paymentMethods/{methodId}`)
```typescript
interface PaymentMethod {
  id: string; // UUID or built-in ID
  name: string; // Display name with duplicate suffix (e.g. City Bank~2)
  type: 'cash' | 'mobile_money' | 'bank' | 'credit_card' | 'other';
  isBuiltIn: boolean; // Cash is true by default
  isActive: boolean; // Archived methods set to false
  balance: number;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
  legacyNames?: string[];
}
```

---

## 2. Financial Formulas

### A. Liquid Wallet Balances
For any active payment method $m$:
$$\text{Balance}(m) = \text{Opening}(m) + \text{Earnings}(m) - \text{Expenses}(m) + \text{TransfersIn}(m) - \text{TransfersOut}(m) - \text{TransferFees}(m) - \text{PeerGiven}(m) + \text{PeerTaken}(m)$$

### B. Liquid Wallet Total
$$\text{Liquid Wallet Total} = \sum_{m \in \text{Active Methods}} \text{Balance}(m)$$

### C. Personal Debt Balances & Net Total
For each person $p$:
$$\text{PersonBalance}(p) = \sum \text{Give}(p) - \sum \text{Take}(p)$$
- If $\text{PersonBalance}(p) > 0$: $p$ owes the user (Receivable).
- If $\text{PersonBalance}(p) < 0$: User owes $p$ (Payable).

$$\text{Total Receivables} = \sum_{p, \text{PersonBalance} > 0} \text{PersonBalance}(p)$$
$$\text{Total Payables} = \sum_{p, \text{PersonBalance} < 0} |\text{PersonBalance}(p)|$$
$$\text{Net Total} = \text{Liquid Wallet Total} + \text{Total Receivables} - \text{Total Payables}$$

### D. Daily Allowance Calculation
- **Direct Mode**:
  $$\text{Daily Allowance} = \text{directDailyBudget}$$
- **Calculated Mode**:
  $$\text{Available} = \max(0, \text{monthlyIncome} - (\text{monthlyFixed} + \text{monthlySavings} + \text{monthlyEmergency}))$$
  $$\text{Net Monthly Allowance} = \text{Available} \times \left(1 - \frac{\text{bufferPct}}{100}\right)$$
  $$\text{Daily Allowance} = \frac{\text{Net Monthly Allowance}}{30}$$

---

## 3. Mandatory Wallet Regression Case (Passed)

- **Given**:
  - Cash Opening: ৳1,040
  - bKash Opening: ৳8,000
  - Nagad Opening: ৳0
  - Initial Wallet Total: ৳9,040 | Initial Net Total: ৳9,040
- **Action**:
  - User lends ৳500 to Emon via bKash (`type: 'give'`).
- **Result**:
  - Cash: ৳1,040
  - bKash: ৳7,500
  - Nagad: ৳0
  - Liquid Wallet Total: ৳8,540
  - Receivables: ৳500
  - Payables: ৳0
  - Net Total: ৳9,040 (৳8,540 liquid + ৳500 receivable)
