/**
 * Хугацаа хэтэрсэн мэдэгдлийн загвар
 * Үүсгэгч: Хугацаа хэтэрсэн үед (төлөв өөрчлөгдөх үед)
 */

import type { OverdueNoticeData, SmsOverdueNoticeData } from '@/types';

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

export function overdueNoticeEmail(data: OverdueNoticeData): EmailTemplate {
    const subject = '【Яаралтай】Төлбөр хугацаа хэтэрсэн';

    const text = `${data.tenant_name} танд,

Дараах нэхэмжлэх төлөгдөөгүй байна.
Яаралтай төлбөрөө төлнө үү.

Нэхэмжлэхийн дугаар: ${data.billing_number}
Нийт дүн: ₮${data.total_amount.toLocaleString()}
Төлөх хугацаа: ${data.due_date} (${data.days_overdue} өдөр хэтэрсэн)

Асуух зүйл байвал удирдлагын компанитай холбогдоно уу.

--
${data.company_name}
Утас: ${data.company_phone}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; }
        .urgent { background: #fee2e2; border: 1px solid #dc2626; border-radius: 6px; padding: 12px; text-align: center; color: #b91c1c; margin: 20px 0; font-weight: 600; }
        .contact { background: #f3f4f6; border-radius: 6px; padding: 16px; margin-top: 20px; text-align: center; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>【Яаралтай】Хугацаа хэтэрсэн мэдэгдэл</h1>
        </div>
        <div class="content">
            <p>${data.tenant_name} танд,</p>
            <p>Дараах нэхэмжлэх төлөгдөөгүй байна.<br>Яаралтай төлбөрөө төлнө үү.</p>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Нэхэмжлэхийн дугаар</span>
                    <span class="value">${data.billing_number}</span>
                </div>
                <div class="info-row">
                    <span class="label">Нийт дүн</span>
                    <span class="value" style="color: #dc2626;">₮${data.total_amount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Төлөх хугацаа</span>
                    <span class="value">${data.due_date}</span>
                </div>
            </div>

            <div class="urgent">
                ${data.days_overdue} өдөр хэтэрсэн
            </div>

            <p>Асуух зүйл байвал удирдлагын компанитай холбогдоно уу.</p>

            <div class="contact">
                <strong>${data.company_name}</strong><br>
                Утас: ${data.company_phone}
            </div>

            <div class="footer">
                <p>${data.company_name}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    return { subject, body: { text, html } };
}

export function overdueNoticeSms(data: SmsOverdueNoticeData): SmsTemplate {
    // 70 тэмдэгтээс бага байх зорилготой
    return {
        message: `【Яаралтай】${data.month} сарын ₮${data.amount.toLocaleString()} төлөгдөөгүй байна. Яаралтай төлнө үү. Утас:${data.phone}`
    };
}
