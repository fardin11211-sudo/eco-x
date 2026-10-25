# EcO Smart Ledger — Firebase Setup, Architecture & Testing Guide

EcO is a mobile-first personal finance Progressive Web Application designed with a high-trust, calm aesthetic for Bangladesh (**৳ BDT**, Cash, bKash, and Nagad).

Every user's financial records are isolated inside their own private Google Firebase space at `/users/{userId}/**`, protected by zero-trust Firestore Security Rules.

---

## 1. Firebase Architecture & Data Isolation

### User Isolation Model
Every authenticated user is assigned a unique `userId` (`request.auth.uid`). All subcollections live under that user's document:
- `/users/{userId}` (Settings, profile information, budget preferences)
- `/users/{userId}/paymentMethods/{methodId}` (Cash, bKash, Nagad, bank accounts)
- `/users/{userId}/expenses/{expenseId}` (Daily tracked expenses)
- `/users/{userId}/recurringExpenses/{recurringId}` (Multi-day amortized expenses)
- `/users/{userId}/earnings/{earningId}` (Income entries)
- `/users/{userId}/transfers/{transferId}` (Transfers between wallets)
- `/users/{userId}/people/{personId}` (Counterparties for lending/borrowing)
- `/users/{userId}/transactions/{transactionId}` (Debt ledger give/take records)
- `/users/{userId}/sources/{sourceId}` (Income categories)
- `/users/{userId}/notifications/{notificationId}` (7-day TTL inbox alerts)

### Dual-Layer Caching & Offline Resilience
- **Zero Flicker**: Auth state is checked before initial render. If logged out, the user immediately sees the Landing Page without a flash of the dashboard.
- **Offline First**: All user mutations are written to a localized device cache (`localStorage`) immediately, providing snappy UI responses. When connected, Firestore real-time snapshots (`onSnapshot`) keep cloud records synchronized.
- **Deduplication on Import**: When importing previous backup files, record IDs are checked to guarantee no duplicates are ever created.

---

## 2. Activating Your Real Firebase Project (Beginner-Friendly Checklist)

The app ships with placeholder keys (`***`) in `src/data/firebase.ts`. While `***` is present, EcO provides a seamless Preview/Demo mode. Follow these steps when you're ready to connect your own live Firebase project:

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Add project** (or **Create a project**).
3. Name it (e.g. `eco-ledger`) and click **Continue**.
4. (Optional) Disable or enable Google Analytics based on your preference, then click **Create project**.

### Step 2: Register a Web App in Firebase
1. On the project overview page, click the Web icon (`</>`).
2. App nickname: `EcO Web App`.
3. (Optional) Check "Also set up Firebase Hosting".
4. Click **Register app**.
5. Firebase will show your `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Paste Keys into `src/data/firebase.ts`
Open `src/data/firebase.ts` and replace the `***` values:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

### Step 4: Enable Authentication Providers
1. In the Firebase console left menu, go to **Build** > **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab:
   - **Google**: Click **Google** > Enable toggle > Set support email > Click **Save**.
   - **Email/Password**: Click **Email/Password** > Enable first toggle ("Email/Password") > Click **Save** (keep "Email link (passwordless)" disabled).

### Step 5: Configure Authorized Domains (Crucial for Google Sign-In)
1. In **Authentication** > **Settings** tab > **Authorized domains**.
2. Ensure `localhost` is listed.
3. If deploying to Netlify (e.g., `your-app.netlify.app`) or a custom domain (`eco.yourdomain.com`), click **Add domain** and add your production domain.

### Step 6: Create Firestore Database & Paste Rules
1. In the Firebase console left menu, go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your users (e.g., `asia-south1` Mumbai or `asia-southeast1` Singapore).
4. Start in **Production mode** (or Test mode, we will overwrite rules immediately).
5. Once created, click the **Rules** tab at the top.
6. Replace all existing text with the exact contents of `firestore.rules` (see below) and click **Publish**.

---

## 3. Production Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Validates user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: Strictly verifies that the authenticated user owns this document tree
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Helper: ID safety sanity check
    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128;
    }

    // Default deny for root documents
    match /{document=**} {
      allow read, write: if false;
    }

    // Root user document (Profile & User Settings)
    match /users/{userId} {
      allow get: if isOwner(userId);
      allow list: if false; // Users cannot be enumerated
      allow create, update: if isOwner(userId);
      allow delete: if isOwner(userId);

      // Subcollections: Wallets, Expenses, Earnings, Debts, Transfers, Notifications
      match /paymentMethods/{methodId} {
        allow read, write: if isOwner(userId) && isValidId(methodId);
      }

      match /expenses/{expenseId} {
        allow read, write: if isOwner(userId) && isValidId(expenseId);
      }

      match /recurringExpenses/{recurringId} {
        allow read, write: if isOwner(userId) && isValidId(recurringId);
      }

      match /earnings/{earningId} {
        allow read, write: if isOwner(userId) && isValidId(earningId);
      }

      match /transfers/{transferId} {
        allow read, write: if isOwner(userId) && isValidId(transferId);
      }

      match /people/{personId} {
        allow read, write: if isOwner(userId) && isValidId(personId);
      }

      match /transactions/{transactionId} {
        allow read, write: if isOwner(userId) && isValidId(transactionId);
      }

      match /sources/{sourceId} {
        allow read, write: if isOwner(userId) && isValidId(sourceId);
      }

      match /notifications/{notificationId} {
        allow read, write: if isOwner(userId) && isValidId(notificationId);
      }

      match /issueReports/{reportId} {
        allow create: if isOwner(userId);
        allow read, update, delete: if false;
      }
    }
  }
}
```

---

## 4. End-to-End Verification Test Checklist

| Scenario | Test Steps | Expected Result |
| :--- | :--- | :--- |
| **1. Logged Out Visitor** | Open root URL while logged out | Welcoming Landing Page displays immediately (value proposition, 5 questions, honest privacy statement, login card). No flash of dashboard. |
| **2. Google Sign-In** | Click "Continue with Google" | Google popup initiates; after approval, redirects seamlessly into user dashboard. Profile picture / initials avatar visible in header & sidebar. |
| **3. Email Sign-Up** | Toggle to "Create account", provide Name, Email, Password, Confirm Password | Account created; gentle unverified email banner displays with "Resend link" button. Dashboard loads smoothly. |
| **4. New User Onboarding** | First login for brand new account | Choice modal appears: Option 1 ("I'm new to EcO") prompts for Cash/bKash/Nagad balances and opening debts. Submitting updates wallets and marks setup complete. |
| **5. JSON Backup Import** | Select Option 2 ("I have previous EcO data") | User uploads JSON file; deep validation runs and displays count summary (expenses, transfers, people, etc.). Deduplication skips existing IDs without crashing. |
| **6. Profile Name Edit** | Go to Settings > Profile > Click pencil next to Name > Save | Name updates immediately in the header greeting, sidebar, and Firestore profile without being overwritten by Google Auth later. |
| **7. Change Password** | Go to Settings > Security > Change Password | Requires current password for re-authentication before updating new password. Clear friendly error if current password is incorrect. |
| **8. Password Reset** | Log out > Click "Forgot password?" on landing page > Submit email | Confirmation shown without revealing whether email exists in the system (prevents email enumeration attacks). |
| **9. Theme & Color Palette** | Settings > Theme / Palette (Dark, Light, System; Green, Blue, Orange) | Switches whole interface theme and palette smoothly. Financial indicator colors (profit green, expense red) remain distinct. |
| **10. Account Sign Out** | Settings > Sign Out (or mobile drawer Sign Out) | Confirms with modal; immediately clears all local memory states and returns to the welcoming landing page. |
| **11. Account Deletion** | Settings > Your Data > Delete Account | Double confirmation modal; purges all user Firestore subcollections and removes the Firebase Auth record. |
