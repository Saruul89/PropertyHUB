import type { MaintenancePriority, MaintenanceStatus } from '@/types';

export const MAINTENANCE_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const;

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
    pending: 'Хүлээгдэж буй',
    in_progress: 'Хийгдэж буй',
    completed: 'Дууссан',
    cancelled: 'Цуцлагдсан',
};

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

export const MAINTENANCE_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
} as const;

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
    low: 'Бага',
    normal: 'Дунд',
    high: 'Өндөр',
    urgent: 'Яаралтай',
};

export const MAINTENANCE_PRIORITY_COLORS: Record<MaintenancePriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

export const MAINTENANCE_CATEGORIES = [
    'Сантехник',
    'Цахилгаан',
    'Агаар сэлгэлт',
    'Хаалга, цонх',
    'Шал, хана, тааз',
    'Ус хангамж',
    'Аюулгүй байдал',
    'Бусад',
] as const;

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [],
    cancelled: [],
};
