/**
 * Utility functions for formatting and cleaning phone numbers
 */

// Landline area codes in Israel (2 digits)
const LANDLINE_CODES = ['02', '03', '04', '08', '09'];

// Mobile prefixes in Israel (3 digits starting with 0)
const MOBILE_PREFIXES = ['050', '051', '052', '053', '054', '055', '056', '057', '058', '059', '072', '073', '074', '076', '077', '078'];

/**
 * Cleans a phone number by removing all non-digit characters
 * @param phone - The phone number to clean
 * @returns Cleaned phone number (digits only) or null if empty
 */
export function cleanPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  return cleaned === '' ? null : cleaned;
}

/**
 * Formats a phone number for display
 * Adds a dash after the area code/prefix
 * 
 * @param phone - The phone number to format (should be digits only)
 * @returns Formatted phone number (e.g., "02-1234567" or "050-1234567") or null
 */
export function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters first
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  
  // Check if it's a mobile number (starts with mobile prefix)
  for (const prefix of MOBILE_PREFIXES) {
    if (cleaned.startsWith(prefix)) {
      // Mobile: 050-1234567 (3 digits prefix + 7 digits)
      if (cleaned.length === 10) {
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
      }
    }
  }
  
  // Check if it's a landline number (starts with landline code)
  for (const code of LANDLINE_CODES) {
    if (cleaned.startsWith(code)) {
      // Landline: 02-1234567 (2 digits code + 7 digits)
      if (cleaned.length === 9) {
        return `${cleaned.substring(0, 2)}-${cleaned.substring(2)}`;
      }
    }
  }
  
  // If we can't determine the format, try common patterns based on length
  if (cleaned.length === 10) {
    // Likely mobile: 050-1234567
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }
  if (cleaned.length === 9) {
    // Likely landline: 02-1234567
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2)}`;
  }
  
  // Return as-is if we can't format it
  return cleaned;
}

/**
 * Handles phone number input - only allows digits
 * @param value - The input value
 * @returns Cleaned value (digits only)
 */
export function handlePhoneInput(value: string): string {
  // Remove all non-digit characters
  return value.replace(/\D/g, '');
}

