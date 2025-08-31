import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export function normalizePhoneNumber(phone: string, countryCode: string = 'IN'): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Clean the phone number
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  try {
    const phoneNumber = parsePhoneNumber(cleaned, countryCode as CountryCode);
    
    if (phoneNumber && isValidPhoneNumber(phoneNumber.number)) {
      return phoneNumber.format('E.164');
    }
  } catch (error) {
    // If parsing fails, try with country code
    try {
      const phoneWithCountry = `+${countryCode === 'IN' ? '91' : '1'}${cleaned}`;
      const phoneNumber = parsePhoneNumber(phoneWithCountry);
      
      if (phoneNumber && isValidPhoneNumber(phoneNumber.number)) {
        return phoneNumber.format('E.164');
      }
    } catch (innerError) {
      // If all parsing fails, return null
    }
  }
  
  return null;
}

export function validatePhoneNumber(phone: string, countryCode: string = 'IN'): boolean {
  return normalizePhoneNumber(phone, countryCode) !== null;
}
