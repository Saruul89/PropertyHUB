/**
 * Гэрээ дуусах сануулгын загвар
 * Үүсгэгч: Гэрээ дуусахаас 30 хоногийн өмнө (өдөр бүр)
 */

import type { LeaseExpiringData } from '@/types';

interface EmailTemplate {
    subject: string;
    body: {
        text: string;
        html: string;
    };
}

export function leaseExpiringEmail(data: LeaseExpiringData): EmailTemplate {
    const subject = '【Мэдэгдэл】Гэрээ сунгах тухай';

    const text = `${data.tenant_name} танд,

Таны гэрээ дуусах хугацаа ойртож байна.

Барилга: ${data.property_name} ${data.unit_number}
Гэрээ дуусах огноо: ${data.end_date} (${data.days_left} хоног үлдлээ)

Гэрээ сунгах хүсэлтэй бол удирдлагын компанитай холбогдоно уу.

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
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; }
        .notice { background: #ede9fe; border: 1px solid #7c3aed; border-radius: 6px; padding: 12px; text-align: center; color: #5b21b6; margin: 20px 0; }
        .contact { background: #f3f4f6; border-radius: 6px; padding: 16px; margin-top: 20px; text-align: center; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Гэрээ сунгах тухай</h1>
        </div>
        <div class="content">
            <p>${data.tenant_name} танд,</p>
            <p>Таны гэрээ дуусах хугацаа ойртож байна.</p>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Барилга</span>
                    <span class="value">${data.property_name}</span>
                </div>
                <div class="info-row">
                    <span class="label">Өрөөний дугаар</span>
                    <span class="value">${data.unit_number}</span>
                </div>
                <div class="info-row">
                    <span class="label">Гэрээ дуусах огноо</span>
                    <span class="value">${data.end_date}</span>
                </div>
            </div>

            <div class="notice">
                Гэрээ дуусах хүртэл <strong>${data.days_left} хоног</strong> үлдлээ
            </div>

            <p>Гэрээ сунгах хүсэлтэй бол удирдлагын компанитай холбогдоно уу.</p>

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
