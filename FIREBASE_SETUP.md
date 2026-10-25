# EcO Smart Ledger — Firebase Setup & Security Guide

This document is provided for the **Project Owner** to manually configure Firebase Authentication, Cloud Firestore collections, security rules, and composite indexes in the Firebase Console. 

EcO Smart Ledger operates in two modes:
1. **Local Offline Sandbox Mode (Default)**: Fully functional local data persistence via the browser's storage engine with zero configuration needed.
2. **Cloud Firebase Mode**: Enabled when you provide your own Firebase web configuration in `src/data/firebase-config.example.ts` (renamed to `firebase-config.ts`).

---

## 1. Firebase Web App Configuration

1. In the [Firebase Console](https://console.firebase.google.com/), open your project and go to **Project Settings > General**.
2. Under **Your apps**, select your Web app (or click **Add app > Web** if you haven't created one yet).
3. Copy the `firebaseConfig` object and paste it into `src/data/firebase-config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 2. Firestore Document Paths & Collections

All user-owned financial data resides under the scoped path `users/{userId}/...`:

| Collection Path | Description | Access Requirement |
| :--- | :--- | :--- |
| `users/{userId}/settings/main` | User preferences, budget settings, categories | `request.auth.uid == userId` |
| `users/{userId}/paymentMethods/{methodId}` | Cash, bKash, and custom accounts | `request.auth.uid == userId` |
| `users/{userId}/expenses/{expenseId}` | Regular, fixed, and emergency expenses | `request.auth.uid == userId` |
| `users/{userId}/recurringExpenses/{id}` | Recurring expense schedules | `request.auth.uid == userId` |
| `users/{userId}/earnings/{earningId}` | Inflows and income entries | `request.auth.uid == userId` |
| `users/{userId}/transfers/{transferId}` | Inter-wallet transfers with fee audits | `request.auth.uid == userId` |
| `users/{userId}/people/{personId}` | Local contacts and ledger balances | `request.auth.uid == userId` |
| `users/{userId}/transactions/{txId}` | Give/Take debt entries | `request.auth.uid == userId` |
| `users/{userId}/notifications/{notifId}` | In-app notification inbox (7-day TTL) | `request.auth.uid == userId` |
| `users/{userId}/sources/{sourceId}` | Income sources | `request.auth.uid == userId` |
| `sharedLinks/{token}` | Public read-only projection for a single person | Read-only with valid unguessable token |

---

## 3. Recommended Firestore Security Rules

Copy and paste the following least-privilege security rules into **Firestore > Rules** in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: is owner of the private user tree
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Private user records
    match /users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }

    // Public share links (strictly read-only projection)
    match /sharedLinks/{token} {
      allow read: if true;
      allow write: if isAuthenticated() && request.resource.data.ownerUid == request.auth.uid;
    }

    // Mutual EcO-to-EcO proposals
    match /proposals/{proposalId} {
      allow read: if isAuthenticated() && (
        resource.data.senderUid == request.auth.uid || 
        resource.data.recipientUid == request.auth.uid
      );
      allow create: if isAuthenticated() && request.resource.data.senderUid == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.recipientUid == request.auth.uid || 
        resource.data.senderUid == request.auth.uid
      );
      allow delete: if false; // Audit logs must not be deleted
    }
  }
}
```

---

## 4. Firestore Composite Indexes

Create composite indexes in the Firebase Console under **Firestore > Indexes** for multi-field queries:

1. **Expenses by Date**:
   - Collection: `expenses` (Scope: Collection group or subcollection)
   - Fields: `date` DESC, `timestamp` DESC
2. **Unified Activity Timeline**:
   - Fields: `date` DESC, `timestamp` DESC
3. **Notifications Retention**:
   - Fields: `createdAt` DESC, `readAt` ASC

---

## 5. Security & Privacy Checklist

- [ ] Confirm no Admin SDK credentials or service-account JSON files are placed in client code.
- [ ] Confirm email addresses and full private user histories are never exposed in public share links.
- [ ] Confirm Firestore TTL or Cloud Functions scheduled cleanup is configured for notifications older than 7 days (`createdAt + 7 days`).
- [ ] Test the least-privilege rules using the Firebase Emulator suite before deploying to production.
