/**
 * MICA Compliance utility functions
 */

/**
 * Get human-readable label for MICA token classification
 */
export function getMicaClassificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    'utility': 'Utility Token',
    'e-money': 'E-Money Token',
    'asset-referenced': 'Asset-Referenced Token',
    'other': 'Other',
  };
  return labels[classification] || classification;
}

/**
 * Get guidance text for MICA token classification
 */
export function getMicaClassificationGuidance(classification: string): string {
  const guidance: Record<string, string> = {
    'utility': 'Provides access to goods or services within a digital ecosystem. Generally subject to lighter regulatory requirements unless marketed as investments.',
    'e-money': 'Represents fiat currency or stable value. Requires e-money authorization and reserve requirements under MICA. Must be redeemable at par value.',
    'asset-referenced': 'Value is stabilized by reference to assets (basket of currencies, commodities, etc.). Requires prospectus approval and authorization from competent authority.',
    'other': 'Does not fit standard classifications. May require legal review to determine applicable regulatory framework.',
  };
  return guidance[classification] || '';
}

/**
 * Valid ISO 3166-1 alpha-2 country codes
 * This is a subset of commonly used codes for jurisdiction restrictions
 */
const VALID_COUNTRY_CODES = [
  'US', 'CN', 'KP', 'IR', 'SY', 'CU', 'VE', 'AF', 'BY', 'MM', 'RU',
  'EU', 'GB', 'SG', 'CH', 'JP', 'AE', 'CA', 'AU', 'NZ', 'HK', 'IN',
  'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'ZA', 'NG', 'EG', 'KE', 'GH',
  'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'NO',
  'PL', 'CZ', 'HU', 'RO', 'GR', 'PT', 'IE', 'SK', 'BG', 'HR', 'SI',
  'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'IS', 'LI', 'MC', 'SM', 'VA',
  'KR', 'TW', 'TH', 'MY', 'ID', 'PH', 'VN', 'BD', 'PK', 'SA',
  'IL', 'TR', 'UA', 'KZ', 'UZ', 'AZ', 'GE', 'AM',
];

/**
 * Validate and parse jurisdiction codes from comma-separated string
 * @param input - Comma-separated string of jurisdiction codes
 * @returns Array of validated uppercase ISO codes
 */
export function parseRestrictedJurisdictions(input: string): {
  valid: string[];
  invalid: string[];
} {
  const codes = input
    .split(',')
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const code of codes) {
    if (VALID_COUNTRY_CODES.includes(code)) {
      valid.push(code);
    } else {
      invalid.push(code);
    }
  }

  return { valid, invalid };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
