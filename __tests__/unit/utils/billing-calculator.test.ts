import { describe, it, expect } from 'vitest';
import {
    calculateFeeAmount,
    calculateBillingTotal,
    calculateOutstanding,
    determineBillingStatus,
    calculateMeterConsumption,
    calculateOccupancyRate,
} from '@/lib/billing/calculator';

describe('calculateFeeAmount', () => {
    describe('fixed calculation type', () => {
        it('should return default amount when no custom amount', () => {
            const feeType = {
                calculation_type: 'fixed' as const,
                default_amount: 50000,
            };
            expect(calculateFeeAmount(feeType, {})).toBe(50000);
        });

        it('should return custom amount when provided', () => {
            const feeType = {
                calculation_type: 'fixed' as const,
                default_amount: 50000,
            };
            const context = { unitFee: { custom_amount: 60000 } };
            expect(calculateFeeAmount(feeType, context)).toBe(60000);
        });

        it('should return 0 when no amounts provided', () => {
            const feeType = { calculation_type: 'fixed' as const };
            expect(calculateFeeAmount(feeType, {})).toBe(0);
        });
    });

    describe('per_sqm calculation type', () => {
        it('should calculate based on area and unit price', () => {
            const feeType = {
                calculation_type: 'per_sqm' as const,
                default_unit_price: 1000,
            };
            const context = { unit: { area_sqm: 50 } };
            expect(calculateFeeAmount(feeType, context)).toBe(50000);
        });

        it('should use custom unit price when provided', () => {
            const feeType = {
                calculation_type: 'per_sqm' as const,
                default_unit_price: 1000,
            };
            const context = {
                unit: { area_sqm: 50 },
                unitFee: { custom_unit_price: 1200 },
            };
            expect(calculateFeeAmount(feeType, context)).toBe(60000);
        });

        it('should return 0 when area is null', () => {
            const feeType = {
                calculation_type: 'per_sqm' as const,
                default_unit_price: 1000,
            };
            const context = { unit: { area_sqm: null as unknown as number } };
            expect(calculateFeeAmount(feeType, context)).toBe(0);
        });

        it('should return 0 when no unit provided', () => {
            const feeType = {
                calculation_type: 'per_sqm' as const,
                default_unit_price: 1000,
            };
            expect(calculateFeeAmount(feeType, {})).toBe(0);
        });
    });

    describe('metered calculation type', () => {
        it('should calculate based on consumption and unit price', () => {
            const feeType = { calculation_type: 'metered' as const };
            const context = {
                meterReading: { consumption: 10, unit_price: 2500 },
            };
            expect(calculateFeeAmount(feeType, context)).toBe(25000);
        });

        it('should return 0 when no meter reading', () => {
            const feeType = { calculation_type: 'metered' as const };
            expect(calculateFeeAmount(feeType, {})).toBe(0);
        });

        it('should handle zero consumption', () => {
            const feeType = { calculation_type: 'metered' as const };
            const context = {
                meterReading: { consumption: 0, unit_price: 2500 },
            };
            expect(calculateFeeAmount(feeType, context)).toBe(0);
        });
    });

    describe('custom calculation type', () => {
        it('should return custom amount when provided', () => {
            const feeType = { calculation_type: 'custom' as const };
            const context = { unitFee: { custom_amount: 30000 } };
            expect(calculateFeeAmount(feeType, context)).toBe(30000);
        });

        it('should return 0 when no custom amount', () => {
            const feeType = { calculation_type: 'custom' as const };
            expect(calculateFeeAmount(feeType, {})).toBe(0);
        });
    });

    describe('unknown calculation type', () => {
        it('should return 0 for unknown type', () => {
            const feeType = { calculation_type: 'unknown' as never };
            expect(calculateFeeAmount(feeType, {})).toBe(0);
        });
    });
});

describe('calculateBillingTotal', () => {
    it('should sum up all item amounts', () => {
        const items = [{ amount: 50000 }, { amount: 12000 }, { amount: 10000 }];
        expect(calculateBillingTotal(items)).toBe(72000);
    });

    it('should return 0 for empty array', () => {
        expect(calculateBillingTotal([])).toBe(0);
    });

    it('should handle single item', () => {
        expect(calculateBillingTotal([{ amount: 50000 }])).toBe(50000);
    });

    it('should handle items with zero amounts', () => {
        const items = [{ amount: 50000 }, { amount: 0 }, { amount: 10000 }];
        expect(calculateBillingTotal(items)).toBe(60000);
    });
});

describe('calculateOutstanding', () => {
    it('should calculate remaining balance', () => {
        expect(calculateOutstanding(100000, 30000)).toBe(70000);
    });

    it('should return 0 when fully paid', () => {
        expect(calculateOutstanding(100000, 100000)).toBe(0);
    });

    it('should return 0 when overpaid', () => {
        expect(calculateOutstanding(100000, 120000)).toBe(0);
    });

    it('should return full amount when nothing paid', () => {
        expect(calculateOutstanding(100000, 0)).toBe(100000);
    });
});

describe('determineBillingStatus', () => {
    const futureDate = new Date('2099-12-31');
    const pastDate = new Date('2020-01-01');
    const currentDate = new Date('2024-03-15');

    it('should return paid when fully paid', () => {
        expect(determineBillingStatus(100000, 100000, futureDate, currentDate)).toBe(
            'paid'
        );
    });

    it('should return paid when overpaid', () => {
        expect(determineBillingStatus(100000, 150000, futureDate, currentDate)).toBe(
            'paid'
        );
    });

    it('should return pending when nothing paid and not past due', () => {
        expect(determineBillingStatus(100000, 0, futureDate, currentDate)).toBe(
            'pending'
        );
    });

    it('should return partial when partially paid and not past due', () => {
        expect(determineBillingStatus(100000, 50000, futureDate, currentDate)).toBe(
            'partial'
        );
    });

    it('should return overdue when nothing paid and past due', () => {
        expect(determineBillingStatus(100000, 0, pastDate, currentDate)).toBe(
            'overdue'
        );
    });

    it('should return overdue when partially paid and past due', () => {
        expect(determineBillingStatus(100000, 50000, pastDate, currentDate)).toBe(
            'overdue'
        );
    });
});

describe('calculateMeterConsumption', () => {
    it('should calculate consumption correctly', () => {
        expect(calculateMeterConsumption(135.2, 123.4)).toBeCloseTo(11.8);
    });

    it('should return 0 when readings are equal', () => {
        expect(calculateMeterConsumption(100, 100)).toBe(0);
    });

    it('should throw error when current is less than previous', () => {
        expect(() => calculateMeterConsumption(100, 150)).toThrow(
            'Current reading cannot be less than previous reading'
        );
    });

    it('should handle decimal readings', () => {
        expect(calculateMeterConsumption(100.5, 99.5)).toBeCloseTo(1.0);
    });
});

describe('calculateOccupancyRate', () => {
    it('should calculate occupancy rate correctly', () => {
        expect(calculateOccupancyRate(8, 10)).toBe(80);
    });

    it('should return 0 when no units', () => {
        expect(calculateOccupancyRate(0, 0)).toBe(0);
    });

    it('should return 100 when all occupied', () => {
        expect(calculateOccupancyRate(10, 10)).toBe(100);
    });

    it('should return 0 when none occupied', () => {
        expect(calculateOccupancyRate(0, 10)).toBe(0);
    });

    it('should round to nearest integer', () => {
        expect(calculateOccupancyRate(1, 3)).toBe(33);
    });
});
