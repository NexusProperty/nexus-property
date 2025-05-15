import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatCurrency,
  truncateString,
  getInitials,
  delay
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should combine class names properly', () => {
      expect(cn('text-red-500', 'bg-blue-300')).toBe('text-red-500 bg-blue-300');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class');
    });

    it('should deduplicate identical classes', () => {
      expect(cn('p-4', 'p-4', 'text-center')).toBe('p-4 text-center');
    });

    it('should properly handle tailwind class conflicts', () => {
      // When two competing classes are provided, the latter should take precedence
      expect(cn('p-2', 'p-4')).toBe('p-4');
      expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-blue-500');
    });
  });

  describe('formatDate', () => {
    it('should format a Date object correctly', () => {
      // Create a date with UTC to avoid timezone issues in tests
      const date = new Date(Date.UTC(2023, 2, 15)); // March 15, 2023
      const formatted = formatDate(date);
      // Just verify the day, month, and year are present correctly
      expect(formatted).toContain('15');
      expect(formatted).toContain('Mar');
      expect(formatted).toContain('2023');
    });

    it('should handle string date input', () => {
      const formatted = formatDate('2023-04-20');
      expect(formatted).toContain('20');
      expect(formatted).toContain('Apr');
      expect(formatted).toContain('2023');
    });

    it('should handle ISO strings', () => {
      // The date may change based on timezone, but the month and year should be consistent
      const result = formatDate('2023-05-10T14:30:00.000Z');
      
      // Due to timezone differences, we can't reliably check for the exact day
      // Just verify that a valid date string is returned with the correct month and year
      expect(result).toContain('May');
      expect(result).toContain('2023');
      
      // Verify it's a properly formatted date string
      expect(result).toMatch(/\d{1,2} May 2023/);
    });
  });

  describe('formatCurrency', () => {
    it('should format round numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
    });

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
    });

    it('should round decimal values', () => {
      expect(formatCurrency(1500.75)).toBe('$1,501');
      expect(formatCurrency(1500.25)).toBe('$1,500');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });
  });

  describe('truncateString', () => {
    it('should not modify strings shorter than the limit', () => {
      expect(truncateString('Hello', 10)).toBe('Hello');
    });

    it('should truncate strings longer than the limit', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello...');
    });

    it('should handle empty strings', () => {
      expect(truncateString('', 5)).toBe('');
    });

    it('should handle exact length strings', () => {
      expect(truncateString('12345', 5)).toBe('12345');
    });
  });

  describe('getInitials', () => {
    it('should return initials from a full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should handle single names', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle multiple word names', () => {
      expect(getInitials('John Middle Doe')).toBe('JD');
    });

    it('should return a question mark for empty strings', () => {
      expect(getInitials('')).toBe('?');
    });

    it('should convert initials to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });

  describe('delay', () => {
    it('should resolve after the specified time', async () => {
      const startTime = Date.now();
      await delay(100);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Allow for some timing inconsistency but ensure it's at least close to 100ms
      expect(duration).toBeGreaterThanOrEqual(90);
    });
  });
}); 