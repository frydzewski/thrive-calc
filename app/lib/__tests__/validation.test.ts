import {
  isValidUuid,
  isValidEmail,
  sanitizeString,
  sanitizeNumber,
} from '../validation';

describe('validation utilities', () => {
  describe('isValidUuid', () => {
    it('should return true for valid UUID v4', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ];

      validUuids.forEach((uuid) => {
        expect(isValidUuid(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUIDs', () => {
      const invalidUuids = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400e29b41d4a716446655440000', // missing dashes
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '',
        '550e8400-e29b-41d4-a716-44665544000g', // invalid character 'g'
      ];

      invalidUuids.forEach((uuid) => {
        expect(isValidUuid(uuid)).toBe(false);
      });
    });

    it('should handle case insensitivity', () => {
      expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user123@test-domain.com',
        'a@b.c',
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user @example.com', // space in local part
        'user@example',
        '',
        'user@@example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace from valid strings', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\t\ntest\n\t')).toBe('test');
      expect(sanitizeString('  spaces  between  ')).toBe('spaces  between');
    });

    it('should return undefined for empty or whitespace-only strings', () => {
      expect(sanitizeString('')).toBeUndefined();
      expect(sanitizeString('   ')).toBeUndefined();
      expect(sanitizeString('\t\n')).toBeUndefined();
    });

    it('should return undefined for null or undefined input', () => {
      expect(sanitizeString(null)).toBeUndefined();
      expect(sanitizeString(undefined)).toBeUndefined();
    });

    it('should return undefined for non-string input', () => {
      expect(sanitizeString(123 as any)).toBeUndefined();
      expect(sanitizeString({} as any)).toBeUndefined();
      expect(sanitizeString([] as any)).toBeUndefined();
    });

    it('should preserve strings without extra whitespace', () => {
      expect(sanitizeString('hello')).toBe('hello');
      expect(sanitizeString('hello world')).toBe('hello world');
    });
  });

  describe('sanitizeNumber', () => {
    describe('basic validation', () => {
      it('should return valid numbers', () => {
        expect(sanitizeNumber(0)).toBe(0);
        expect(sanitizeNumber(42)).toBe(42);
        expect(sanitizeNumber(-10)).toBe(-10);
        expect(sanitizeNumber(3.14)).toBe(3.14);
      });

      it('should return null for invalid numbers', () => {
        expect(sanitizeNumber(NaN)).toBeNull();
        expect(sanitizeNumber(Infinity)).toBeNull();
        expect(sanitizeNumber(-Infinity)).toBeNull();
      });

      it('should return null for non-number types', () => {
        expect(sanitizeNumber('123')).toBeNull();
        expect(sanitizeNumber(null)).toBeNull();
        expect(sanitizeNumber(undefined)).toBeNull();
        expect(sanitizeNumber({})).toBeNull();
        expect(sanitizeNumber([])).toBeNull();
      });
    });

    describe('min option', () => {
      it('should enforce minimum value', () => {
        expect(sanitizeNumber(10, { min: 5 })).toBe(10);
        expect(sanitizeNumber(5, { min: 5 })).toBe(5);
        expect(sanitizeNumber(4, { min: 5 })).toBeNull();
        expect(sanitizeNumber(-5, { min: 0 })).toBeNull();
      });
    });

    describe('max option', () => {
      it('should enforce maximum value', () => {
        expect(sanitizeNumber(10, { max: 20 })).toBe(10);
        expect(sanitizeNumber(20, { max: 20 })).toBe(20);
        expect(sanitizeNumber(21, { max: 20 })).toBeNull();
      });
    });

    describe('min and max together', () => {
      it('should enforce both min and max', () => {
        const options = { min: 10, max: 100 };
        expect(sanitizeNumber(50, options)).toBe(50);
        expect(sanitizeNumber(10, options)).toBe(10);
        expect(sanitizeNumber(100, options)).toBe(100);
        expect(sanitizeNumber(9, options)).toBeNull();
        expect(sanitizeNumber(101, options)).toBeNull();
      });
    });

    describe('allowNegative option', () => {
      it('should reject negative numbers when allowNegative is false', () => {
        expect(sanitizeNumber(-5, { allowNegative: false })).toBeNull();
        expect(sanitizeNumber(-0.1, { allowNegative: false })).toBeNull();
        expect(sanitizeNumber(0, { allowNegative: false })).toBe(0);
        expect(sanitizeNumber(5, { allowNegative: false })).toBe(5);
      });

      it('should allow negative numbers by default', () => {
        expect(sanitizeNumber(-5)).toBe(-5);
        expect(sanitizeNumber(-100.5)).toBe(-100.5);
      });

      it('should allow negative numbers when explicitly true', () => {
        expect(sanitizeNumber(-5, { allowNegative: true })).toBe(-5);
      });
    });

    describe('combined options', () => {
      it('should work with min and allowNegative false', () => {
        const options = { min: 0, allowNegative: false };
        expect(sanitizeNumber(10, options)).toBe(10);
        expect(sanitizeNumber(0, options)).toBe(0);
        expect(sanitizeNumber(-1, options)).toBeNull();
      });

      it('should work with all options', () => {
        const options = { min: 0, max: 100, allowNegative: false };
        expect(sanitizeNumber(50, options)).toBe(50);
        expect(sanitizeNumber(0, options)).toBe(0);
        expect(sanitizeNumber(100, options)).toBe(100);
        expect(sanitizeNumber(-1, options)).toBeNull();
        expect(sanitizeNumber(101, options)).toBeNull();
      });
    });
  });
});
