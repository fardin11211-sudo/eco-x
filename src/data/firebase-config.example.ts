// Replace these placeholders with the Firebase Web App configuration
// supplied manually by the project owner in the Firebase Console.
// Do NOT put service-account credentials or Admin SDK secrets in browser code.

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_FIREBASE_APP_ID"
};

export function isFirebaseConfigured(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('PASTE_YOUR') &&
    Boolean(firebaseConfig.projectId) &&
    !firebaseConfig.projectId.includes('PASTE_YOUR')
  );
}
