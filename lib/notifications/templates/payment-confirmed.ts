/**
 * Төлбөр баталгаажсан мэдэгдлийн загвар
 * Үүсгэгч: Төлбөр бүртгэгдсэн үед
 */

import type { PaymentConfirmedData } from '@/types';

interface EmailTemplate {
    subject: string;
    body: {
        text: string;
        html: string;
    };
}

export function paymentConfirmedEmail(data: PaymentConfirmedData): EmailTemplate {
    const subject = '【PropertyHub】Төлбөр баталгаажлаа';

    const remainingMessage = data.remaining_amount > 0
        ? `Үлдэгдэл ₮${data.remaining_amount.toLocaleString()} байна.`
        : 'Энэ сарын төлбөр бүрэн төлөгдлөө.';

    const text = `${data.tenant_name} танд,

Дараах төлбөрийг баталгаажууллаа.
Баярлалаа.

Нэхэмжлэхийн дугаар: ${data.billing_number}
Төлсөн дүн: ₮${data.paid_amount.toLocaleString()}
Төлсөн огноо: ${data.payment_date}

${remainingMessage}

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
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; }
        .success { background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 12px; text-align: center; color: #166534; margin: 20px 0; }
        .remaining { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; text-align: center; color: #92400e; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Төлбөр баталгаажлаа</h1>
        </div>
        <div class="content">
            <p>${data.tenant_name} танд,</p>
            <p>Дараах төлбөрийг баталгаажууллаа.<br>Баярлалаа.</p>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Нэхэмжлэхийн дугаар</span>
                    <span class="value">${data.billing_number}</span>
                </div>
                <div class="info-row">
                    <span class="label">Төлсөн дүн</span>
                    <span class="value" style="color: #16a34a;">₮${data.paid_amount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Төлсөн огноо</span>
                    <span class="value">${data.payment_date}</span>
                </div>
            </div>

            ${data.remaining_amount > 0
                ? `<div class="remaining">Үлдэгдэл ₮${data.remaining_amount.toLocaleString()} байна</div>`
                : '<div class="success">Энэ сарын төлбөр бүрэн төлөгдлөө</div>'
            }

            <div class="footer">
                <p>${data.company_name}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    return { subject, body: { text, html } };
}
