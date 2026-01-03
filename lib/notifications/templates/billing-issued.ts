/**
 * Нэхэмжлэх үүссэн мэдэгдлийн загвар
 * Үүсгэгч: Нэхэмжлэх үүсгэсэн үед
 */

import type { BillingIssuedData } from '@/types';

interface EmailTemplate {
    subject: string;
    body: {
        text: string;
        html: string;
    };
}

export function billingIssuedEmail(data: BillingIssuedData): EmailTemplate {
    const subject = `【PropertyHub】${data.month} сарын нэхэмжлэх`;

    const text = `${data.tenant_name} танд,

${data.month} сарын нэхэмжлэх үүслээ.

━━━━━━━━━━━━━━━━━━━━
Нэхэмжлэхийн дугаар: ${data.billing_number}
Тооцооны сар: ${data.billing_month}
Нийт дүн: ₮${data.total_amount.toLocaleString()}
Төлөх хугацаа: ${data.due_date}
━━━━━━━━━━━━━━━━━━━━

Дэлгэрэнгүй мэдээллийг оршин суугчийн порталаас харна уу.
${data.portal_url}

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
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; }
        .amount { font-size: 1.5em; color: #2563eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Нэхэмжлэхийн мэдэгдэл</h1>
        </div>
        <div class="content">
            <p>${data.tenant_name} танд,</p>
            <p>${data.month} сарын нэхэмжлэх үүслээ.</p>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Нэхэмжлэхийн дугаар</span>
                    <span class="value">${data.billing_number}</span>
                </div>
                <div class="info-row">
                    <span class="label">Тооцооны сар</span>
                    <span class="value">${data.billing_month}</span>
                </div>
                <div class="info-row">
                    <span class="label">Нийт дүн</span>
                    <span class="value amount">₮${data.total_amount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Төлөх хугацаа</span>
                    <span class="value">${data.due_date}</span>
                </div>
            </div>

            <p>Дэлгэрэнгүй мэдээллийг оршин суугчийн порталаас харна уу.</p>
            <a href="${data.portal_url}" class="button">Портал нээх</a>

            <div class="footer">
                <p>${data.company_name}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    return { subject, body: { text, html } };
}
