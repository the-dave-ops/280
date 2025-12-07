/**
 * Validates Israeli ID number using checksum algorithm
 * @param idNumber - The ID number to validate (9 digits)
 * @returns boolean - true if valid, false otherwise
 */
export function validateIsraeliID(idNumber: string): boolean {
  // Remove any non-digit characters
  const cleanID = idNumber.replace(/\D/g, '');

  // Check length (should be 8 or 9 digits)
  if (cleanID.length < 8 || cleanID.length > 9) {
    return false;
  }

  // Pad with leading zero if 8 digits
  const paddedID = cleanID.length === 8 ? '0' + cleanID : cleanID;

  // Extract first 8 digits and check digit
  const digits = paddedID.slice(0, 8).split('').map(Number);
  const checkDigit = parseInt(paddedID[8]);

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      // Even positions (0-indexed, so odd positions)
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }

  // Calculate control digit
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;

  return calculatedCheckDigit === checkDigit;
}

