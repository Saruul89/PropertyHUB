import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Зөв имэйл хаяг оруулна уу'),
    password: z.string().min(1, 'Нууц үг оруулна уу'),
});

export const tenantLoginSchema = z.object({
    phone: z.string().min(8, 'Утасны дугаар оруулна уу'),
    password: z.string().min(1, 'Нууц үг оруулна уу'),
});

export const registerSchema = z.object({
    companyName: z.string().min(2, 'Компанийн нэр 2 тэмдэгтээс дээш байх ёстой'),
    email: z.string().email('Зөв имэйл хаяг оруулна уу'),
    phone: z.string().min(8, 'Утасны дугаар 8 оронтой байх ёстой'),
    password: z.string().min(8, 'Нууц үг 8 тэмдэгтээс дээш байх ёстой'),
    confirmPassword: z.string(),
    companyType: z.enum(['apartment', 'office']),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Нууц үг таарахгүй байна',
    path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TenantLoginInput = z.infer<typeof tenantLoginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
