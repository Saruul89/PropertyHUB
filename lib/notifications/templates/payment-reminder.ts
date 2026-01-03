/**
 * Төлбөрийн сануулгын загвар
 * Үүсгэгч: Хугацаа дуусахаас 3 хоногийн өмнө (өдөр бүр)
 */

import type { PaymentReminderData, SmsPaymentReminderData } from '@/types';

interface EmailTemplate {
    subject: string;
    body: {
        text: string;
        html: string;
    };
}

interface SmsTemplate {
    message: string;
}

export function paymentReminderEmail(data: PaymentReminderData): EmailTemplate {
    const subject = '【Сануулга】Төлбөрийн хугацаа ойртож байна';

    const text = `${data.tenant_name} танд,

Дараах нэхэмжлэхийн төлбөрийн хугацаа ойртож байна.

Нэхэмжлэхийн дугаар: ${data.billing_number}
Нийт дүн: ₮${data.total_amount.toLocaleString()}
Төлөх хугацаа: ${data.due_date} (${data.days_left} хоног үлдлээ)

Төлбөрөө мартахгүй байхыг хүсье.

--
${data.company_name}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; text-align: center; color: #92400e; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Төлбөрийн сануулга</h1>
        </div>
        <div class="content">
            <p>${data.tenant_name} танд,</p>
            <p>Дараах нэхэмжлэхийн төлбөрийн хугацаа ойртож байна.</p>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Нэхэмжлэхийн дугаар</span>
                    <span class="value">${data.billing_number}</span>
                </div>
                <div class="info-row">
                    <span class="label">Нийт дүн</span>
                    <span class="value">₮${data.total_amount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Төлөх хугацаа</span>
                    <span class="value">${data.due_date}</span>
                </div>
            </div>

            <div class="warning">
                <strong>${data.days_left} хоног</strong> үлдлээ
            </div>

            <p>Төлбөрөө мартахгүй байхыг хүсье.</p>

            <div class="footer">
                <p>${data.company_name}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    return { subject, body: { text, html } };
}

export function paymentReminderSms(data: SmsPaymentReminderData): SmsTemplate {
    // 70 тэмдэгтээс бага байх зорилготой
    return {
        message: `【PropertyHub】${data.month} сарын ₮${data.amount.toLocaleString()} төлбөр ${data.due_date}-нд дуусна. Дэлгэрэнгүй: ${data.short_url}`
    };
}
