/**
 * Formats a numeric value into Bangladeshi Taka (৳) with Indian/Bangladeshi digit grouping:
 * e.g., 162450 -> "৳ 1,62,450.00"
 */
export function formatTaka(amount: number | null | undefined, includeSymbol = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '৳ 0.00' : '0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Round to 2 decimal places
  const fixed = absAmount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian / Bangladeshi grouping: last 3 digits, then groups of 2 digits
  let formattedInteger = integerPart;
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const groupedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInteger = `${groupedOther},${lastThree}`;
  }

  const formatted = `${formattedInteger}.${decimalPart}`;
  const prefix = isNegative ? '-' : '';

  return includeSymbol ? `${prefix}৳ ${formatted}` : `${prefix}${formatted}`;
}

export function parseTakaInput(val: string): number {
  if (!val) return 0;
  // Clean all characters except digits, minus, and period
  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

export function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
