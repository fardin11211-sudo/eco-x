/**
 * EcO-to-EcO Two-User Connection & Proposal Inversion Logic
 */

import { EcOConnection, EcOProposal, TransactionType } from './types';

/**
 * Inverts the transaction direction for the recipient.
 * If User A 'give' (User A lent money, expects to receive):
 * User B's ledger perspective MUST be 'take' (User B received/borrowed money, owes User A).
 *
 * If User A 'take' (User A borrowed money, owes User B):
 * User B's ledger perspective MUST be 'give' (User B lent money, expects to receive).
 */
export function invertProposalDirection(senderDirection: TransactionType): TransactionType {
  return senderDirection === 'give' ? 'take' : 'give';
}

/**
 * Validates connection code format.
 * Format: ECO-XXXX or user handle (at least 4 alphanumerics).
 */
export function validateConnectionCode(code: string): boolean {
  if (!code) return false;
  const cleaned = code.trim().toUpperCase();
  return /^[A-Z0-9-]{4,16}$/.test(cleaned);
}

/**
 * Generates a stable deterministic connection code for this device/user.
 */
export function generateDefaultConnectionCode(seed = ''): string {
  if (seed) {
    const hash = seed.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10000, 0);
    return `ECO-${String(Math.abs(hash)).padStart(4, '0')}`;
  }
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ECO-${rand}`;
}
