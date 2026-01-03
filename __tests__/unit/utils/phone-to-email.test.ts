import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variable
vi.stubEnv('NEXT_PUBLIC_TENANT_EMAIL_DOMAIN', 'tenant.propertyhub.mn');

// Import after mocking env
const { phoneToEmail, emailToPhone, isTenantEmail } = await import(
    '@/lib/utils/phone-to-email'
);

describe('phoneToEmail', () => {
    it('should convert phone number to email', () => {
        expect(phoneToEmail('99001234')).toBe('99001234@tenant.propertyhub.mn');
    });

    it('should remove hyphens from phone number', () => {
        expect(phoneToEmail('99-00-1234')).toBe('99001234@tenant.propertyhub.mn');
    });

    it('should remove spaces from phone number', () => {
        expect(phoneToEmail('99 001 234')).toBe('99001234@tenant.propertyhub.mn');
    });

    it('should remove all non-digit characters', () => {
        expect(phoneToEmail('+976-99-001-234')).toBe(
            '97699001234@tenant.propertyhub.mn'
        );
    });

    it('should handle phone with parentheses', () => {
        expect(phoneToEmail('(99) 001-234')).toBe('99001234@tenant.propertyhub.mn');
    });

    it('should handle empty string', () => {
        expect(phoneToEmail('')).toBe('@tenant.propertyhub.mn');
    });
});

describe('emailToPhone', () => {
    it('should extract phone number from tenant email', () => {
        expect(emailToPhone('99001234@tenant.propertyhub.mn')).toBe('99001234');
    });

    it('should extract local part from any email', () => {
        expect(emailToPhone('user@example.com')).toBe('user');
    });

    it('should handle email with subdomains', () => {
        expect(emailToPhone('test@mail.example.com')).toBe('test');
    });
});

describe('isTenantEmail', () => {
    it('should return true for tenant email domain', () => {
        expect(isTenantEmail('99001234@tenant.propertyhub.mn')).toBe(true);
    });

    it('should return false for other email domains', () => {
        expect(isTenantEmail('user@example.com')).toBe(false);
    });

    it('should return false for similar but different domain', () => {
        expect(isTenantEmail('99001234@tenant.propertyhub.com')).toBe(false);
    });

    it('should return false for subdomain mismatch', () => {
        expect(isTenantEmail('99001234@propertyhub.mn')).toBe(false);
    });

    it('should be case sensitive for domain', () => {
        expect(isTenantEmail('99001234@TENANT.PROPERTYHUB.MN')).toBe(false);
    });
});
