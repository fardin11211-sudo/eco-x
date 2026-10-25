/**
 * Safe Firebase Initialization Boundary
 *
 * Checks whether the project owner has provided valid Firebase configuration
 * credentials or whether the template placeholders remain.
 * Does NOT fabricate API keys or fake authenticated status.
 */

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.example';

export interface FirebaseInitStatus {
  isConfigured: boolean;
  statusMessage: string;
  missingFields: string[];
}

export function checkFirebaseStatus(): FirebaseInitStatus {
  const missing: string[] = [];

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('PASTE_YOUR')) {
    missing.push('apiKey');
  }
  if (!firebaseConfig.projectId || firebaseConfig.projectId.includes('PASTE_YOUR')) {
    missing.push('projectId');
  }
  if (!firebaseConfig.appId || firebaseConfig.appId.includes('PASTE_YOUR')) {
    missing.push('appId');
  }

  const isConfigured = missing.length === 0;

  return {
    isConfigured,
    missingFields: missing,
    statusMessage: isConfigured
      ? 'Firebase Web App credentials detected and ready.'
      : 'Firebase credentials are unconfigured. The app runs safely in Local Offline Sandbox Mode.'
  };
}
