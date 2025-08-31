import { normalizePhoneNumber, validatePhoneNumber } from './phone.utils';

describe('Phone Utils', () => {
  describe('normalizePhoneNumber', () => {
    it('should normalize "98765 43210" to "+919876543210"', () => {
      const result = normalizePhoneNumber('98765 43210');
      expect(result).toBe('+919876543210');
    });

    it('should normalize "9876543210" to "+919876543210"', () => {
      const result = normalizePhoneNumber('9876543210');
      expect(result).toBe('+919876543210');
    });

    it('should normalize "(987) 654-3210" to "+919876543210"', () => {
      const result = normalizePhoneNumber('(987) 654-3210');
      expect(result).toBe('+919876543210');
    });

    it('should return null for invalid phone numbers', () => {
      const result = normalizePhoneNumber('invalid');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = normalizePhoneNumber('');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = normalizePhoneNumber(null as any);
      expect(result).toBeNull();
    });
  });

  describe('validatePhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(validatePhoneNumber('98765 43210')).toBe(true);
      expect(validatePhoneNumber('9876543210')).toBe(true);
      expect(validatePhoneNumber('(987) 654-3210')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(validatePhoneNumber('invalid')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false);
    });
  });
});
