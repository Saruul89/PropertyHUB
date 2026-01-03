/**
 * Бүртгэл үүссэн мэдэгдлийн загвар
 * Үүсгэгч: Оршин суугч бүртгэгдсэн үед
 * Зөвхөн SMS илгээнэ
 */

import type { SmsAccountCreatedData } from '@/types';

interface SmsTemplate {
    message: string;
}

export function accountCreatedSms(data: SmsAccountCreatedData): SmsTemplate {
    // 70 тэмдэгтээс бага байх зорилготой
    return {
        message: `【PropertyHub】Бүртгэл үүслээ. ID:${data.phone} Нууц үг:${data.password} Нэвтрэх:${data.url}`
    };
}
