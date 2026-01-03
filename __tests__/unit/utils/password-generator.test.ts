import { describe, it, expect } from 'vitest';
import { generateInitialPassword } from '@/lib/utils/password-generator';

describe('generateInitialPassword', () => {
    it('should generate an 8-digit password', () => {
        const password = generateInitialPassword();
        expect(password).toHaveLength(8);
    });

    it('should only contain numbers', () => {
        const password = generateInitialPassword();
        expect(password).toMatch(/^\d+$/);
    });

    it('should generate different passwords on each call', () => {
        const passwords = new Set<string>();
        for (let i = 0; i < 100; i++) {
            passwords.add(generateInitialPassword());
        }
        // Statistically, 100 random 8-digit passwords should be mostly unique
        expect(passwords.size).toBeGreaterThan(90);
    });

    it('should return a string type', () => {
        const password = generateInitialPassword();
        expect(typeof password).toBe('string');
    });

    it('should not start with leading zeros being stripped', () => {
        // Generate many passwords and check that the length is always 8
        for (let i = 0; i < 50; i++) {
            const password = generateInitialPassword();
            expect(password.length).toBe(8);
        }
    });
});
