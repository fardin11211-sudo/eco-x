/**
 * Centralized financial validation engine for EcO Smart Ledger
 */

export interface ValidationOutcome {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateExpenseInput(data: {
  amount: number;
  category: string;
  payMethodId: string;
  date: string;
}): ValidationOutcome {
  const errors: Record<string, string> = {};

  if (isNaN(data.amount) || data.amount <= 0) {
    errors.amount = 'Amount must be a positive number greater than 0.';
  }
  if (!data.category || !data.category.trim()) {
    errors.category = 'Please select or specify a category.';
  }
  if (!data.payMethodId) {
    errors.payMethodId = 'Please select a payment wallet.';
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.date = 'Please provide a valid date (YYYY-MM-DD).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateTransferInput(data: {
  fromMethodId: string;
  toMethodId: string;
  amount: number;
  chargeRate?: number;
}): ValidationOutcome {
  const errors: Record<string, string> = {};

  if (isNaN(data.amount) || data.amount <= 0) {
    errors.amount = 'Transfer amount must be greater than 0.';
  }
  if (!data.fromMethodId) {
    errors.fromMethodId = 'Please select a source payment account.';
  }
  if (!data.toMethodId) {
    errors.toMethodId = 'Please select a destination payment account.';
  }
  if (data.fromMethodId && data.toMethodId && data.fromMethodId === data.toMethodId) {
    errors.toMethodId = 'Source and destination accounts must be different.';
  }
  if (data.chargeRate !== undefined && (isNaN(data.chargeRate) || data.chargeRate < 0)) {
    errors.chargeRate = 'Cashout fee rate cannot be negative.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validatePeerTransactionInput(data: {
  personId: string;
  amount: number;
  payMethodId: string;
  type: 'give' | 'take';
}): ValidationOutcome {
  const errors: Record<string, string> = {};

  if (!data.personId) {
    errors.personId = 'Please select or add a person.';
  }
  if (isNaN(data.amount) || data.amount <= 0) {
    errors.amount = 'Transaction amount must be greater than 0.';
  }
  if (!data.payMethodId) {
    errors.payMethodId = 'Please specify the wallet used.';
  }
  if (data.type !== 'give' && data.type !== 'take') {
    errors.type = 'Direction must be Give or Take.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone || !phone.trim()) return { isValid: true }; // optional
  const clean = phone.replace(/[\s-]/g, '');
  // Standard phone format check allowing international prefix +880
  const validRegex = /^\+?[0-9]{8,15}$/;
  if (!validRegex.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number with country code (e.g. +88017...).'
    };
  }
  return { isValid: true };
}
